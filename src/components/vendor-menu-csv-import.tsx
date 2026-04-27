"use client";

import * as React from "react";
import { Download, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MenuCsvImportSummary, MenuItem } from "@/interfaces/user-interface";
import { StringHelper } from "@/models/string-helper-model";
import { menuApiService } from "@/services/menu-api-service";

type VendorMenuCsvImportProps = {
  vendorName: string;
  vendorUserId: string;
  menuItems?: MenuItem[];
  onImported?: () => void;
};

export function VendorMenuCsvImport({
  vendorName,
  vendorUserId,
  menuItems = [],
  onImported,
}: VendorMenuCsvImportProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = React.useState<File[]>(
    [],
  );
  const [importSummary, setImportSummary] =
    React.useState<MenuCsvImportSummary | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const downloadTemplate = () => {
    StringHelper.downloadCSV(
      [
        {
          name: "Sample Menu Item",
          description: "Short item description",
          imgUrls: "sample-menu-item.jpg",
          price: 12.5,
          minQty: 1,
          maxQty: 99,
          available: "TRUE",
          itemType: "INDIVIDUAL",
          meatWellness: "NA",
          categoryId: "REPLACE_WITH_GLOBAL_CATEGORY_ID",
          menuCategoryName: "Desserts",
          meatId: "",
          preparationTime: 10,
          allowCustomize: "TRUE",
          hasFlavors: "TRUE",
          flavors: "Lemon Pepper|Hot|Mild|Habanero",
          flavorsPerOrder: 2,
          newDish: "FALSE",
          popularDish: "FALSE",
          "diet[0]": "",
          "diet[1]": "",
          "diet[2]": "",
          "diet[3]": "",
          "diet[4]": "",
          "diet[5]": "",
          subItemJson: "",
          userId: "",
          strikePrice: "",
          discountType: "FIXED",
          hasDiscount: "FALSE",
          discountMode: "CUSTOM",
          predefinedDiscountId: "",
          discountValue: "",
          bogoItemIds: "",
          discount: "",
        },
      ],
      "menu-items-import-template",
    );
  };

  const getGlobalCategoryId = (item: MenuItem) => {
    const category = (item as any).category;
    return (
      category?.categoriesId?._id ||
      category?.categoriesId ||
      (item as any).globalCategoryId ||
      item.categoryId ||
      ""
    );
  };

  const downloadCurrentMenu = () => {
    if (!menuItems.length) {
      toast.error("There are no menu items to download.");
      return;
    }

    StringHelper.downloadCSV(
      menuItems.map((item) => {
        const anyItem = item as any;
        const dietIds = Array.isArray(anyItem.diet)
          ? anyItem.diet
              .map((diet: { _id?: string } | string) =>
                typeof diet === "string" ? diet : diet?._id,
              )
              .filter(Boolean)
          : [];

        return {
          name: item.name || "",
          description: item.description || "",
          imgUrls: (item.imgUrls || []).join("|"),
          price: item.price ?? "",
          minQty: item.minQty ?? "",
          maxQty: item.maxQty ?? "",
          available: item.available ? "TRUE" : "FALSE",
          itemType: item.itemType || "INDIVIDUAL",
          meatWellness: anyItem.meatWellness || "NA",
          categoryId: getGlobalCategoryId(item),
          menuCategoryName: anyItem.category?.name || "",
          meatId: anyItem.meatId?._id || anyItem.meatId || "",
          preparationTime: anyItem.preparationTime ?? "",
          allowCustomize: anyItem.allowCustomize ? "TRUE" : "FALSE",
          hasFlavors: anyItem.hasFlavors ? "TRUE" : "FALSE",
          flavors: (anyItem.flavors || [])
            .filter((flavor: string) => flavor !== "Plain")
            .join("|"),
          flavorsPerOrder: anyItem.flavorsPerOrder ?? "",
          newDish: anyItem.newDish ? "TRUE" : "FALSE",
          popularDish: anyItem.popularDish ? "TRUE" : "FALSE",
          "diet[0]": dietIds[0] || "",
          "diet[1]": dietIds[1] || "",
          "diet[2]": dietIds[2] || "",
          "diet[3]": dietIds[3] || "",
          "diet[4]": dietIds[4] || "",
          "diet[5]": dietIds[5] || "",
          subItemJson: anyItem.subItem?.length
            ? JSON.stringify(
                anyItem.subItem.map(
                  (subItem: {
                    menuItem?: { _id?: string } | string;
                    qty?: number;
                  }) => ({
                    menuItem:
                      typeof subItem.menuItem === "string"
                        ? subItem.menuItem
                        : subItem.menuItem?._id,
                    qty: subItem.qty || 1,
                  }),
                ),
              )
            : "",
          userId: vendorUserId,
          strikePrice: anyItem.strikePrice ?? "",
          discountType: anyItem.discountType || "FIXED",
          hasDiscount: anyItem.hasDiscount ? "TRUE" : "FALSE",
          discountMode: anyItem.discountMode || "CUSTOM",
          predefinedDiscountId:
            anyItem.predefinedDiscountId?._id ||
            anyItem.predefinedDiscountId ||
            "",
          discountValue: anyItem.discountValue ?? "",
          bogoItemIds: Array.isArray(anyItem.bogoItems)
            ? anyItem.bogoItems
                .map((bogoItem: { itemId?: { _id?: string } | string }) =>
                  typeof bogoItem.itemId === "string"
                    ? bogoItem.itemId
                    : bogoItem.itemId?._id,
                )
                .filter(Boolean)
                .join("|")
            : "",
          discount: anyItem.discount ?? "",
        };
      }),
      `${vendorName || "vendor"}-current-menu`,
    );
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const openImageFilePicker = () => {
    imageInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setImportSummary(null);
  };

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    setSelectedImageFiles(files);
    setImportSummary(null);
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error("Choose a CSV file before importing.");
      return;
    }

    setIsImporting(true);

    menuApiService
      .importCsv(selectedFile, vendorUserId, selectedImageFiles)
      .then((response) => {
        const summary = response.data.data.importSummary;
        setImportSummary(summary);

        if (summary.failedCount > 0) {
          toast.warning("Menu import completed with some row errors.");
        } else {
          toast.success(`Imported ${summary.importedCount} menu items.`);
        }

        setSelectedFile(null);
        setSelectedImageFiles([]);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }

        onImported?.();
      })
      .catch((error) => {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Something went wrong while importing the menu CSV.",
        );
      })
      .finally(() => {
        setIsImporting(false);
      });
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileSpreadsheet className="text-primary" />
            Menu CSV Import
          </div>
          <p className="text-sm text-muted-foreground">
            Upload the existing `menu-items-import.csv` format for{" "}
            <span className="font-semibold text-foreground">{vendorName}</span>.
            This import writes menu data for the selected vendor only.
          </p>
          <p className="text-sm text-muted-foreground">
            When you import from this vendor page, the selected vendor is used
            automatically, so the CSV `userId` value is ignored.
          </p>
          <p className="text-sm text-muted-foreground">
            Use the template download if you want the exact header layout and a
            starter sample row.
          </p>
          <p className="text-sm text-muted-foreground">
            Put image filenames in the CSV `imgUrls` column, separated by `|`
            for multiple images. Select those image files here and the import
            will upload them to S3 automatically with unique file names.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/heic"
            multiple
            className="hidden"
            onChange={handleImageFileChange}
          />
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <Download />
            Download Template
          </Button>
          <Button type="button" variant="outline" onClick={downloadCurrentMenu}>
            <Download />
            Download Current Menu
          </Button>
          <Button type="button" variant="outline" onClick={openFilePicker}>
            <Upload />
            Select CSV
          </Button>
          <Button type="button" variant="outline" onClick={openImageFilePicker}>
            <Upload />
            Select Images
          </Button>
          <Button
            type="button"
            disabled={!selectedFile || isImporting}
            onClick={handleImport}
            className="min-w-[150px]"
          >
            {isImporting && <LoaderCircle className="animate-spin" />}
            Import Menu CSV
          </Button>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-3 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-sm">
          Ready to import:{" "}
          <span className="font-semibold">{selectedFile.name}</span>
        </div>
      )}

      {selectedImageFiles.length > 0 && (
        <div className="mt-3 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-sm">
          Images selected:{" "}
          <span className="font-semibold">{selectedImageFiles.length}</span>
        </div>
      )}

      {importSummary && (
        <Alert
          className="mt-4"
          variant={importSummary.failedCount > 0 ? "destructive" : "default"}
        >
          <AlertTitle>Last Import Summary</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Rows: {importSummary.totalRows}, imported:{" "}
              {importSummary.importedCount}, created:{" "}
              {importSummary.createdCount}, updated:{" "}
              {importSummary.updatedCount}, new menu categories:{" "}
              {importSummary.categoryCreatedCount}, uploaded images:{" "}
              {importSummary.uploadedImageCount || 0}, failed:{" "}
              {importSummary.failedCount}
            </p>
            {importSummary.errors.slice(0, 5).map((error) => (
              <p
                key={`${error.rowNumber}-${error.menuItemName}-${error.message}`}
              >
                Row {error.rowNumber}
                {error.menuItemName ? ` (${error.menuItemName})` : ""}:{" "}
                {error.message}
              </p>
            ))}
            {importSummary.errors.length > 5 && (
              <p>
                {importSummary.errors.length - 5} more row error(s) were
                returned by the import.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
