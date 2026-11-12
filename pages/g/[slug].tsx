import { GetServerSideProps } from "next";
import Head from "next/head";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { signIn } from "next-auth/react";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { getDisplayUrl } from "../../lib/storage";
import {
  ACCESS_CODE_LENGTH,
  ACCESS_LOCK_MINUTES,
  MAX_ACCESS_ATTEMPTS,
  canOpenGalleryByLink,
  isValidShareSlug,
} from "../../lib/galleryAccessRules";
import { STUDIO_CONTACT_NAME } from "../../lib/studio";
import { CodeInput } from "../../components/gallery/CodeInput";
import { InstallPrompt } from "../../components/InstallPrompt";

type Props = {
  slug: string;
  projectId: string;
  title: string;
  photoCount: number;
  coverUrl: string | null;
  /** Where to go after a correct code (defaults to the gallery). */
  redirectTo?: string;
};

export default function GalleryAccessPage({ slug, projectId, title, photoCount, coverUrl, redirectTo }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const open = async (value = code) => {
    if (value.length !== ACCESS_CODE_LENGTH || loading) return;
    setLoading(true);
    setError("");
    const result = await signIn("gallery", { slug, code: value, redirect: false });
    if (result?.ok && !result.error) {
      await router.replace(redirectTo || `/projects/${projectId}`);
      return;
    }
    setLoading(false);
    setCode("");
    setError(
      `That code didn't work. Check the message from ${STUDIO_CONTACT_NAME} and try again — after ${MAX_ACCESS_ATTEMPTS} tries the link pauses for ${ACCESS_LOCK_MINUTES} minutes.`,
    );
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    open();
  };

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-trumi-ink text-white">
      <Head>
        <title>{`${title} | TruMiEyes`}</title>
        <meta name="robots" content="noindex" />
        <meta name="theme-color" content="#231F20" />
      </Head>
      {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />}
      <div className="absolute inset-0 bg-gradient-to-b from-trumi-ink/20 via-trumi-ink/60 to-trumi-ink md:bg-gradient-to-r md:from-trumi-ink md:via-trumi-ink/80 md:to-trumi-ink/10" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 py-10 md:justify-center md:px-12">
        <img src="/brand/logo-stacked-white.svg" alt="TruMiEyes" className="mx-auto w-36 md:absolute md:left-12 md:top-10 md:mx-0 md:w-40" />

        <div className="mt-auto w-full max-w-md space-y-7 md:mt-0">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-brand text-white/80">Your private gallery</p>
            <h1 className="break-words font-display text-5xl font-extralight leading-none md:text-6xl">{title}</h1>
            <p className="text-[15px] leading-7 text-white/80">
              {photoCount} photos are ready for you. Enter the {ACCESS_CODE_LENGTH}-digit code {STUDIO_CONTACT_NAME} sent with your link.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <fieldset className="space-y-3" disabled={loading}>
              <legend className="mb-3 text-sm text-white/80">Gallery code</legend>
              <CodeInput
                length={ACCESS_CODE_LENGTH}
                value={code}
                onChange={(value) => {
                  setCode(value);
                  if (error) setError("");
                }}
                onComplete={open}
                invalid={Boolean(error)}
              />
            </fieldset>
            <p aria-live="polite" className="min-h-[1.25rem] text-sm leading-6 text-[#F7B2B5]">
              {error}
            </p>
            <button
              type="submit"
              disabled={code.length !== ACCESS_CODE_LENGTH || loading}
              className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-white text-[15px] font-semibold text-trumi-ink transition hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-trumi-ink disabled:opacity-50"
            >
              {loading ? "Opening…" : "Open my gallery"}
            </button>
          </form>

          <InstallPrompt />
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const slug = context.params?.slug;
  if (!isValidShareSlug(slug)) return { notFound: true };

  const project = await prisma.clientProject.findUnique({
    where: { shareSlug: slug },
    select: {
      id: true,
      title: true,
      status: true,
      clientId: true,
      accessCodeHash: true,
      images: {
        where: { status: { in: ["CLIENT_REVIEW", "APPROVED"] } },
        orderBy: { uploadedAt: "asc" },
        take: 1,
        select: { imagePath: true },
      },
      _count: { select: { images: { where: { status: { in: ["CLIENT_REVIEW", "APPROVED"] } } } } },
    },
  });
  if (!project || !project.accessCodeHash || !canOpenGalleryByLink(project.status)) {
    return { notFound: true };
  }

  // Already signed in as this gallery's client? Skip the code.
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session?.user?.role === "CLIENT" && session.user.id === project.clientId) {
    return { redirect: { destination: `/projects/${project.id}`, permanent: false } };
  }

  return {
    props: {
      slug,
      projectId: project.id,
      title: project.title,
      photoCount: project._count.images,
      coverUrl: project.images[0] ? await getDisplayUrl(project.images[0].imagePath, "/bg.jpg") : null,
    },
  };
};
