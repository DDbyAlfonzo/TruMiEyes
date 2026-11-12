import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import Head from "next/head";
import Link from "next/link";
import { getDisplayUrl, getThumbnailUrl } from "../../lib/storage";
import { GalleryHeader } from "../../components/gallery/GalleryHeader";

type Props = {
  projects: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    photoCount: number;
    coverImageUrl: string | null;
  }[];
};

export default function ClientDashboard({ projects }: Props) {
  return (
    <div className="gallery-theme min-h-screen">
      <Head>
        <title>Your galleries | TruMiEyes</title>
        <meta name="theme-color" content="#FAFAF8" />
      </Head>
      <GalleryHeader />
      <main className="mx-auto max-w-[1360px] px-4 pb-20 pt-10 md:px-10 md:pt-16">
        <p className="text-[11px] uppercase tracking-brand text-ink-soft">Welcome back</p>
        <h1 className="mt-3 font-display text-5xl font-extralight leading-none text-trumi-ink md:text-7xl">Your galleries</h1>

        {projects.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-hairline px-6 py-20 text-center">
            <p className="font-display text-2xl font-light text-trumi-ink">Your photos are on their way</p>
            <p className="mt-2 text-sm text-ink-soft">Galleries appear here as soon as they're ready for you.</p>
          </div>
        ) : (
          <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <li key={project.id} className="animate-tile-in" style={{ animationDelay: `${index * 60}ms` }}>
                <Link
                  href={`/projects/${project.id}`}
                  className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trumi-red/40 focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-lg bg-stone">
                    <img
                      src={project.coverImageUrl || "/bg.jpg"}
                      alt=""
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-trumi-ink">{project.title}</h2>
                      <p className="mt-1 text-sm text-ink-soft">
                        {project.photoCount} photos ·{" "}
                        {new Date(project.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-hairline px-3 py-1 text-xs text-trumi-ink">
                      {STATUS_COPY[project.status] || "Ready"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

const STATUS_COPY: Record<string, string> = {
  SHARED: "Ready to choose",
  IN_REVIEW: "Changes requested",
  APPROVED: "Approved",
  COMPLETED: "Delivered",
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "CLIENT") {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const projects = await prisma.clientProject.findMany({
    where: {
      clientId: session.user?.id as string,
      status: { not: "DRAFT" },
    },
    include: {
      images: {
        where: { status: { in: ["CLIENT_REVIEW", "APPROVED"] } },
        orderBy: { uploadedAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          images: { where: { status: { in: ["CLIENT_REVIEW", "APPROVED"] } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    props: {
      projects: await Promise.all(
        projects.map(async (project) => ({
          id: project.id,
          title: project.title,
          status: project.status,
          createdAt: project.createdAt.toISOString(),
          photoCount: project._count.images,
          coverImageUrl: project.images[0]
            ? getThumbnailUrl(await getDisplayUrl(project.images[0].imagePath, "/bg.jpg"), 1200)
            : null,
        })),
      ),
    },
  };
};
