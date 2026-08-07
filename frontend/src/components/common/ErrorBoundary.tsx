import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { withTranslation, type WithTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundaryBase extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const { t } = this.props;
      return (
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t("errorBoundary.somethingWrong")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{this.state.error.message}</p>
          </div>
          <Button onClick={() => this.setState({ error: null })}>{t("errorBoundary.tryAgain")}</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);
