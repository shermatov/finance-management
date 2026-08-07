import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Plus, Tags, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { useCategories, useDeleteCategory } from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/api";
import type { Category } from "@/types";

function CategoryGroup({
  title,
  categories,
  onEditRequest,
  onDeleteRequest,
}: {
  title: string;
  categories: Category[];
  onEditRequest: (category: Category) => void;
  onDeleteRequest: (category: Category) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("categories.noCategoriesYet")}</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-medium">{cat.name}</span>
                  {cat.isDefault && <span className="text-xs text-muted-foreground">({t("common.default")})</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEditRequest(cat)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  {!cat.isDefault && (
                    <Button variant="ghost" size="icon" onClick={() => onDeleteRequest(cat)}>
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const handleEditRequest = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      toast.success(t("categories.deleted"));
      setDeletingCategory(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("categories.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("categories.subtitle")}</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t("categories.addCategory")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : !categories || categories.length === 0 ? (
        <Card className="border-border/60 shadow-soft">
          <CardContent>
            <EmptyState icon={Tags} title={t("categories.emptyTitle")} description={t("categories.emptyDescription")} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CategoryGroup
            title={t("categories.income")}
            categories={categories.filter((c) => c.type === "INCOME")}
            onEditRequest={handleEditRequest}
            onDeleteRequest={setDeletingCategory}
          />
          <CategoryGroup
            title={t("categories.expense")}
            categories={categories.filter((c) => c.type === "EXPENSE")}
            onEditRequest={handleEditRequest}
            onDeleteRequest={setDeletingCategory}
          />
        </div>
      )}

      <CategoryFormDialog open={formOpen} onOpenChange={handleFormOpenChange} category={editingCategory} />
      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title={t("categories.deleteTitle")}
        description={t("categories.deleteDescription")}
        confirmLabel={t("common.delete")}
        destructive
        isLoading={deleteCategory.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
