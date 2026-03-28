import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

/**
 * 청크 로드 실패(배포 갱신 등)를 감지하는 Error Boundary.
 * 일반 에러: fallback UI 표시.
 * ChunkLoadError: "새 버전으로 업데이트" 안내 + 수동 새로고침 버튼.
 */
export class LazyLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("Loading CSS chunk") ||
      error.message.includes("preloadError");

    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[LazyLoadErrorBoundary]", error.message, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, isChunkError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.state.isChunkError) {
      return (
        <div className="flex h-[80vh] w-full items-center justify-center bg-background p-6">
          <div className="flex max-w-sm flex-col items-center gap-5 rounded-2xl border border-border bg-white p-8 text-center shadow-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-foreground">새 버전이 배포되었습니다</h2>
              <p className="text-sm text-muted-foreground">
                앱이 업데이트되어 페이지를 새로 불러와야 합니다.
                <br />
                아래 버튼을 눌러 새로고침해 주세요.
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="h-11 w-full rounded-xl bg-[#24303F] px-6 text-sm font-bold text-white transition-colors hover:bg-[#1a232e]"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex h-[80vh] w-full items-center justify-center bg-background p-6">
        <div className="flex max-w-sm flex-col items-center gap-5 rounded-2xl border border-border bg-white p-8 text-center shadow-lg">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">오류가 발생했습니다</h2>
            <p className="text-sm text-muted-foreground">
              일시적인 문제가 발생했습니다. 다시 시도해 주세요.
            </p>
          </div>
          <div className="flex w-full gap-2">
            <button
              onClick={this.handleRetry}
              className="h-11 flex-1 rounded-xl border border-border bg-white px-4 text-sm font-bold text-foreground transition-colors hover:bg-gray-50"
            >
              다시 시도
            </button>
            <button
              onClick={this.handleReload}
              className="h-11 flex-1 rounded-xl bg-[#24303F] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1a232e]"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }
}
