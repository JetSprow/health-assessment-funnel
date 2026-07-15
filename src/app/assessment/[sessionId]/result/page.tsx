import { ResultView } from "./result-view";

export default async function AssessmentResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <ResultView sessionId={sessionId} />;
}
