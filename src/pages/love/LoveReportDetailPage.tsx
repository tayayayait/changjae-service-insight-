import { useParams } from "react-router-dom";
import { LoveReportPageBase } from "./LoveReportPageBase";

export default function LoveReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();

  return <LoveReportPageBase reportId={reportId} />;
}
