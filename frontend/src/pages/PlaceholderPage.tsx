import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { navItems } from "@/components/layout/nav-items";

export default function PlaceholderPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const current = navItems.find((item) => item.path === location.pathname);
  const sectionName = current ? t(current.labelKey) : t("placeholder.thisSection");

  return (
    <Card className="border-border/60 shadow-soft">
      <CardContent>
        <EmptyState
          icon={Construction}
          title={`${sectionName} ${t("placeholder.titleSuffix")}`}
          description={t("placeholder.description")}
        />
      </CardContent>
    </Card>
  );
}
