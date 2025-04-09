import ProfileServer, {
  generateProfileMetadata,
} from "@/components/ProfileServer";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  return generateProfileMetadata(params.id);
}

export default async function ProfilePage({ params }: Props) {
  return <ProfileServer id={params.id} />;
}

export const dynamic = "force-dynamic";
export const revalidate = 60;
