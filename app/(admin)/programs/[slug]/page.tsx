import ProgramHub from "../_hub";

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProgramHub slug={slug} />;
}
