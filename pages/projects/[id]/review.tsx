import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { getDisplayUrl } from "../../../lib/storage";
import { canAccessProjectReview } from "../../../lib/workflowRules";
import { ImageWithFallback } from "../../../components/ImageWithFallback";

type Props = {
  projectTitle: string;
  selection: {
    selectedLayoutName: string | null;
    notes: string | null;
    selectedImages: { id: string; imageUrl: string }[];
  } | null;
};

export default function ReviewPage({ projectTitle, selection }: Props) {
  return (
    <main className="min-h-screen bg-trumi-dark text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">Review: {projectTitle}</h1>
        {!selection && <p className="text-white/60">No submission yet.</p>}
        {selection && (
          <>
            <div className="rounded-3xl border border-white/10 bg-[#111318] p-6">
              <p className="text-white/60">Layout</p>
              <p className="text-lg font-semibold">{selection.selectedLayoutName || "None"}</p>
              <p className="text-white/60 mt-4">Notes</p>
              <p>{selection.notes || "No notes provided."}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {selection.selectedImages.map((image) => (
                <ImageWithFallback key={image.id} src={image.imageUrl} alt="Selected image" className="rounded-xl" />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || !session.user?.role) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const projectId = context.params?.id as string;
  const project = await prisma.clientProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      clientId: true,
      status: true,
    },
  });
  if (!project || project.status === "DRAFT") {
    return { notFound: true };
  }

  if (!canAccessProjectReview({
    role: session.user.role,
    sessionUserId: session.user.id,
    projectClientId: project.clientId,
  })) {
    return { notFound: true };
  }

  const selection = await prisma.clientSelection.findFirst({
    where: { projectId, clientId: project.clientId },
    include: { selectedLayout: true, selectedImages: { include: { projectImage: true } } },
  });

  return {
    props: {
      projectTitle: project.title,
      selection: selection
        ? {
            selectedLayoutName: selection.selectedLayout?.name || null,
            notes: selection.notes,
            selectedImages: await Promise.all(
              selection.selectedImages.map(async (item) => ({
                id: item.projectImageId,
                imageUrl: await getDisplayUrl(item.projectImage.imagePath, "/trumieyeslogo.png"),
              })),
            ),
          }
        : null,
    },
  };
};
