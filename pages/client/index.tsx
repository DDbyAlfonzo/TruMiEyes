import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { getDisplayUrl } from "../../lib/storage";
import { AppShell } from "../../components/AppShell";
import { EmptyState } from "../../components/EmptyState";
import { GalleryCard } from "../../components/GalleryCard";
import { BrandMark } from "../../components/BrandMark";

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
    <AppShell role="client" title="Your galleries" eyebrow="Client portal">
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-line bg-surface p-6 md:p-8">
        <div className="absolute inset-0 opacity-20">
          <img src="/bg.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        </div>
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(300px,0.2fr)]">
        <div className="space-y-5">
          <BrandMark />
          <p className="page-kicker">Private sessions</p>
          <h2 className="editorial-title mt-3">Review, favourite, approve.</h2>
        </div>
        <p className="self-end text-sm leading-6 text-muted">
          TruMiEyes galleries are prepared for calm review, considered favourites, and final image delivery.
        </p>
        </div>
      </section>

      {projects.length === 0 ? (
        <EmptyState
          title="No galleries available yet"
          description="Shared galleries will appear here when they are ready for review."
        />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <GalleryCard
              key={project.id}
              href={`/projects/${project.id}`}
              title={project.title}
              status={project.status}
              createdAt={project.createdAt}
              photoCount={project.photoCount}
              coverImageUrl={project.coverImageUrl}
            />
          ))}
        </section>
      )}
    </AppShell>
  );
}

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
            ? await getDisplayUrl(project.images[0].imagePath, "/bg.jpg")
            : null,
        })),
      ),
    },
  };
};
