import ParticipantProfile from "../_profile";

export default async function ParticipantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ParticipantProfile id={id} />;
}
