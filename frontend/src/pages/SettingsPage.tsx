import { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useUpdateProfile, useChangePassword } from "@/hooks/useProfile";
import { currencyOptions } from "@/lib/account-meta";
import { getErrorMessage } from "@/lib/api";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  ru: "Русский",
  ky: "Кыргызча",
};

function ProfileSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");

  const onSave = async () => {
    try {
      await updateProfile.mutateAsync({ firstName, lastName });
      toast.success(t("settings.profile.updated"));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{t("settings.profile.title")}</CardTitle>
        <CardDescription>{t("settings.profile.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">{t("settings.profile.firstName")}</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">{t("settings.profile.lastName")}</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t("settings.profile.email")}</Label>
          <Input value={user?.email ?? ""} disabled />
          <p className="text-xs text-muted-foreground">{t("settings.profile.emailHint")}</p>
        </div>
        <Button
          onClick={onSave}
          disabled={updateProfile.isPending || !firstName.trim() || !lastName.trim()}
        >
          {updateProfile.isPending ? t("common.saving") : t("settings.profile.save")}
        </Button>
      </CardContent>
    </Card>
  );
}

function PasswordSection() {
  const { t } = useTranslation();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && !mismatch;

  const onSave = async () => {
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success(t("settings.password.changed"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{t("settings.password.title")}</CardTitle>
        <CardDescription>{t("settings.password.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">{t("settings.password.current")}</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">{t("settings.password.new")}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t("settings.password.confirm")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {mismatch && <p className="text-xs text-danger">{t("settings.password.mismatch")}</p>}
          </div>
        </div>
        <Button onClick={onSave} disabled={!canSubmit || changePassword.isPending}>
          {changePassword.isPending ? t("settings.password.changing") : t("settings.password.change")}
        </Button>
      </CardContent>
    </Card>
  );
}

function PreferencesSection() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const onCurrencyChange = async (currency: string) => {
    try {
      await updateSettings.mutateAsync({ currency: currency as never });
      toast.success(t("settings.preferences.currencyUpdated"));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onLanguageChange = async (language: SupportedLanguage) => {
    i18n.changeLanguage(language);
    try {
      await updateSettings.mutateAsync({ language });
      toast.success(t("settings.preferences.languageUpdated"));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{t("settings.preferences.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t("settings.preferences.theme")}</Label>
          <Select value={theme} onValueChange={(v) => setTheme(v as typeof theme)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("common.light")}</SelectItem>
              <SelectItem value="dark">{t("common.dark")}</SelectItem>
              <SelectItem value="system">{t("settings.preferences.matchSystem")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("settings.preferences.language")}</Label>
          <Select value={i18n.language} onValueChange={(v) => onLanguageChange(v as SupportedLanguage)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("settings.preferences.defaultCurrency")}</Label>
          {isLoading ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <Select value={settings?.currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">{t("settings.preferences.currencyHint")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsSection() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  type NotifyKey = "notifyBudgetExceeded" | "notifyUpcomingBills" | "notifySavingsMilestone" | "notifyLowBalance";
  const rows: { key: NotifyKey; label: string; description: string }[] = [
    { key: "notifyBudgetExceeded", label: t("settings.notifications.budgetExceeded"), description: t("settings.notifications.budgetExceededDesc") },
    { key: "notifyUpcomingBills", label: t("settings.notifications.upcomingBills"), description: t("settings.notifications.upcomingBillsDesc") },
    { key: "notifySavingsMilestone", label: t("settings.notifications.savingsMilestone"), description: t("settings.notifications.savingsMilestoneDesc") },
    { key: "notifyLowBalance", label: t("settings.notifications.lowBalance"), description: t("settings.notifications.lowBalanceDesc") },
  ];

  const onToggle = async (key: NotifyKey, value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [key]: value } as never);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{t("settings.notifications.title")}</CardTitle>
        <CardDescription className="flex items-start gap-1.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("settings.notifications.disclaimer")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !settings
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
          : rows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.description}</p>
                </div>
                <Switch
                  checked={settings[row.key] as boolean}
                  onCheckedChange={(checked) => onToggle(row.key, checked)}
                />
              </div>
            ))}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileSection />
        <PasswordSection />
        <PreferencesSection />
        <NotificationsSection />
      </div>
    </div>
  );
}
