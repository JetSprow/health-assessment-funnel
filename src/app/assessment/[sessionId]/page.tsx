import { AssessmentFunnel } from "./assessment-funnel";

export default async function AssessmentSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <AssessmentFunnel sessionId={sessionId} />;
}
