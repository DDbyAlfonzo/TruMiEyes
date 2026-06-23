import { GetServerSideProps } from "next";
import Link from "next/link";
import { Camera } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { AppShell } from "../../../components/AppShell";
import { Button } from "../../../components/ui/button";
import { GalleryCard } from "../../../components/GalleryCard";
import { EmptyState } from "../../../components/EmptyState";
import { getDisplayUrl } from "../../../lib/storage";

type Props = {
  projects: {
    id: string;
    title: string;
    status: string;
    clientEmail: string;
    createdAt: string;
    photoCount: number;
    coverImageUrl: string | null;
  }[];
};

export default function ProjectsPage({ projects }: Props) {
  return (
    <AppShell
      role="admin"
      title="Projects"
      eyebrow="Admin"
      actions={
        <Link href="/admin/projects/new">
          <Button>
            <Camera size={16} />
            New project
          </Button>
        </Link>
      }
    >
      <div className="mb-8">
        <p className="page-kicker">Gallery pipeline</p>
        <h2 className="editorial-title mt-3">All client sessions.</h2>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a client project, upload images, and share a proofing gallery."
          actionLabel="New project"
          href="/admin/projects/new"
        />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <GalleryCard
              key={project.id}
              href={`/admin/projects/${project.id}`}
              title={project.title}
              status={project.status}
              createdAt={project.createdAt}
              photoCount={project.photoCount}
              coverImageUrl={project.coverImageUrl}
              clientEmail={project.clientEmail}
            />
          ))}
        </section>
      )}
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const projects = await prisma.clientProject.findMany({
    include: {
      client: true,
      images: { orderBy: { uploadedAt: "desc" }, take: 1 },
      _count: { select: { images: true } },
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
          clientEmail: project.client.email,
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
