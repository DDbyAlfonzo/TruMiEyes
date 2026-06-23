import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

export default function HomePage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.role) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  return {
    redirect: {
      destination: session.user.role === "ADMIN" ? "/admin" : "/client",
      permanent: false,
    },
  };
};
