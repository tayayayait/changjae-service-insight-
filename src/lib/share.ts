import { SajuResult, ShareCardVariant } from "@/types/result";

const CALENDAR_LABEL: Record<string, string> = {
  solar: "양력",
  lunar: "음력",
  "lunar-leap": "음력 윤달",
};

const elementColor: Record<string, string> = {
  목: "#AEE7D8",
  화: "#FFB59E",
  토: "#EBCB9B",
  금: "#D9D6F5",
  수: "#AFCFFF",
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = `${line}${words[i]} `;
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, cursorY);
      line = `${words[i]} `;
      cursorY += lineHeight;
      continue;
    }
    line = testLine;
  }

  if (line.trim()) {
    ctx.fillText(line.trim(), x, cursorY);
  }

  return cursorY;
};

const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("이미지 생성에 실패했습니다."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });

const variantTitle = (variant: ShareCardVariant) => {
  if (variant === "love") {
    return "연애/관계 요약";
  }
  if (variant === "fortune") {
    return "오늘의 운세 요약";
  }
  return "사주 요약";
};

export const buildResultUrl = (resultId?: string) => {
  const path = resultId ? `/result/${resultId}` : "/result";
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
};

export const copyResultUrl = async (resultId?: string) => {
  const url = buildResultUrl(resultId);
  await navigator.clipboard.writeText(url);
  return url;
};

export const tryNativeShare = async (result: SajuResult, variant: ShareCardVariant) => {
  const url = buildResultUrl(result.id);
  if (!navigator.share) {
    return false;
  }

  await navigator.share({
    title: `사주 분석 - ${variantTitle(variant)}`,
    text: result.summary,
    url,
  });
  return true;
};

export const createShareCardBlob = async (result: SajuResult, variant: ShareCardVariant) => {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("공유 카드 캔버스를 생성할 수 없습니다.");
  }

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#FFFDF8");
  gradient.addColorStop(0.5, "#F6EFE6");
  gradient.addColorStop(1, "#FFFFFF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#24303F";
  ctx.font = "800 56px Pretendard";
  ctx.fillText("내 사주 리포트", 72, 120);

  ctx.fillStyle = "#5E6B7A";
  ctx.font = "500 30px Pretendard";
  ctx.fillText(variantTitle(variant), 72, 176);

  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#E7DDD1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(60, 230, 960, 340, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#24303F";
  ctx.font = "700 40px Pretendard";
  wrapText(ctx, result.summary, 100, 305, 880, 62);

  ctx.fillStyle = "#8B96A3";
  ctx.font = "500 28px Pretendard";
  const calendar = CALENDAR_LABEL[result.profileData.calendarType] ?? result.profileData.calendarType;
  ctx.fillText(`${result.profileData.year}.${result.profileData.month}.${result.profileData.day} (${calendar})`, 100, 510);

  ctx.fillStyle = "#24303F";
  ctx.font = "700 34px Pretendard";
  ctx.fillText("오행 분포", 72, 660);

  const chartX = 72;
  let chartY = 710;
  result.oheng.forEach((item) => {
    const valueWidth = Math.max(20, (item.percentage / 100) * 720);

    ctx.fillStyle = elementColor[item.element] ?? "#D9D9D9";
    ctx.beginPath();
    ctx.roundRect(chartX + 150, chartY - 28, valueWidth, 34, 14);
    ctx.fill();

    ctx.fillStyle = "#24303F";
    ctx.font = "600 28px Pretendard";
    ctx.fillText(item.element, chartX, chartY);

    ctx.fillStyle = "#5E6B7A";
    ctx.fillText(`${item.percentage}%`, chartX + 900, chartY);

    chartY += 70;
  });

  ctx.fillStyle = "#24303F";
  ctx.font = "700 30px Pretendard";
  ctx.fillText("실전 조언", 72, 1080);

  ctx.fillStyle = "#5E6B7A";
  ctx.font = "500 28px Pretendard";
  const primaryAdvice = result.sections[0]?.advice ?? "오늘은 무리한 결정보다 균형을 우선하세요.";
  wrapText(ctx, primaryAdvice, 72, 1135, 930, 44);

  ctx.fillStyle = "#8B96A3";
  ctx.font = "500 24px Pretendard";
  ctx.fillText(`Generated ${new Date().toISOString().slice(0, 10)} · saju-insight`, 72, 1290);

  return toBlob(canvas);
};

export const downloadShareCard = async (result: SajuResult, variant: ShareCardVariant) => {
  const blob = await createShareCardBlob(result, variant);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `saju-share-${result.id ?? "local"}.png`;
  a.click();
  URL.revokeObjectURL(url);
};
