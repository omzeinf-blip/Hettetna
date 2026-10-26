"use client";

import { saveProjectAction, savePropertyAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/admin/FormMessage";
import { ImageManager } from "@/components/admin/ImageManager";
import { useAdminForm } from "@/components/admin/useAdminForm";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { ProjectFormValues, PropertyFormValues } from "@/lib/admin/forms";
import {
  areaLabels,
  availabilityLabels,
  deliveryLabels,
  finishingLabels,
  furnishingLabels,
  legalLabels,
  listingSourceLabels,
  propertyTypeLabels,
  transactionLabels,
} from "@/lib/i18n";

const section = "space-y-4 rounded-sm border border-line bg-white p-5";

function options(labels: Record<string, string>, skip: string[] = []) {
  return Object.entries(labels)
    .filter(([value]) => !skip.includes(value))
    .map(([value, label]) => (
      <option key={value} value={value}>
        {label}
      </option>
    ));
}

export function PropertyForm({ initial }: { initial: PropertyFormValues }) {
  const { state, pending, onSubmit } = useAdminForm(savePropertyAction);
  const e = state.errors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormMessage state={state} />

      <section className={section}>
        <h2 className="text-lg font-medium">البيانات الأساسية</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="كود العقار" htmlFor="propertyCode" error={e.propertyCode}>
            <Input id="propertyCode" name="propertyCode" defaultValue={initial.propertyCode} required maxLength={40} dir="ltr" />
          </Field>
          <Field label="الرابط (slug) — اتركه فارغًا ليُنشأ تلقائيًا" htmlFor="slug" error={e.slug}>
            <Input id="slug" name="slug" defaultValue={initial.slug} maxLength={160} dir="ltr" />
          </Field>
        </div>
        <Field label="عنوان العقار" htmlFor="title" error={e.title}>
          <Input id="title" name="title" defaultValue={initial.title} required maxLength={200} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="نوع العملية" htmlFor="transactionType" error={e.transactionType}>
            <Select id="transactionType" name="transactionType" defaultValue={initial.transactionType}>
              {options(transactionLabels)}
            </Select>
          </Field>
          <Field label="نوع العقار" htmlFor="propertyType" error={e.propertyType}>
            <Select id="propertyType" name="propertyType" defaultValue={initial.propertyType}>
              {options(propertyTypeLabels)}
            </Select>
          </Field>
          <Field label="المنطقة" htmlFor="areaId" error={e.areaId}>
            <Select id="areaId" name="areaId" defaultValue={initial.areaId}>
              {options(areaLabels)}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="الكمبوند (اختياري)" htmlFor="compound">
            <Input id="compound" name="compound" defaultValue={initial.compound} />
          </Field>
          <Field label="الحي / الموقع (اختياري)" htmlFor="neighborhood">
            <Input id="neighborhood" name="neighborhood" defaultValue={initial.neighborhood} />
          </Field>
        </div>
      </section>

      <section className={section}>
        <h2 className="text-lg font-medium">السعر والمواصفات</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="السعر (جنيه مصري)" htmlFor="price" error={e.price}>
            <Input id="price" name="price" type="number" min={1} step="any" defaultValue={initial.price} required dir="ltr" />
          </Field>
          <Field label="المساحة (م²)" htmlFor="areaSqm" error={e.areaSqm}>
            <Input id="areaSqm" name="areaSqm" type="number" min={1} step="any" defaultValue={initial.areaSqm} required dir="ltr" />
          </Field>
          <Field label="غرف النوم" htmlFor="bedrooms" error={e.bedrooms}>
            <Input id="bedrooms" name="bedrooms" type="number" min={0} max={50} defaultValue={initial.bedrooms} dir="ltr" />
          </Field>
          <Field label="الحمامات" htmlFor="bathrooms" error={e.bathrooms}>
            <Input id="bathrooms" name="bathrooms" type="number" min={0} max={50} defaultValue={initial.bathrooms} dir="ltr" />
          </Field>
          <Field label="التشطيب" htmlFor="finishing" error={e.finishing}>
            <Select id="finishing" name="finishing" defaultValue={initial.finishing}>
              <option value="">غير محدد</option>
              {options(finishingLabels)}
            </Select>
          </Field>
          <Field label="الفرش" htmlFor="furnishing" error={e.furnishing}>
            <Select id="furnishing" name="furnishing" defaultValue={initial.furnishing}>
              <option value="">غير محدد</option>
              {options(furnishingLabels)}
            </Select>
          </Field>
          <Field label="الدور (اختياري)" htmlFor="floor">
            <Input id="floor" name="floor" defaultValue={initial.floor} />
          </Field>
          <Field label="حالة التسليم" htmlFor="deliveryStatus" error={e.deliveryStatus}>
            <Select id="deliveryStatus" name="deliveryStatus" defaultValue={initial.deliveryStatus}>
              <option value="">غير محدد</option>
              {options(deliveryLabels)}
            </Select>
          </Field>
        </div>
        <Field label="خطة السداد (اختياري)" htmlFor="paymentPlanNote">
          <Textarea id="paymentPlanNote" name="paymentPlanNote" defaultValue={initial.paymentPlanNote} />
        </Field>
      </section>

      <section className={section}>
        <h2 className="text-lg font-medium">الوصف والمميزات</h2>
        <Field label="الوصف" htmlFor="description" error={e.description}>
          <Textarea id="description" name="description" defaultValue={initial.description} rows={6} />
        </Field>
        <Field label="المميزات (ميزة في كل سطر)" htmlFor="features" error={e.features}>
          <Textarea id="features" name="features" defaultValue={initial.features} rows={4} />
        </Field>
      </section>

      <section className={section}>
        <h2 className="text-lg font-medium">الصور</h2>
        <ImageManager name="images" kind="properties" initial={initial.images} defaultAlt={initial.title} error={e.images} />
      </section>

      <section className={section}>
        <h2 className="text-lg font-medium">المصدر والتوفر والمراجعة القانونية</h2>
        <p className="text-xs leading-6 text-muted">
          لا تحدّد «متاح» إلا بعد التأكد فعليًا من توفر الوحدة. سيُسجَّل تاريخ المراجعة واسم من غيّر الحالة.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="مصدر العرض" htmlFor="listingSource" error={e.listingSource}>
            <Select id="listingSource" name="listingSource" defaultValue={initial.listingSource}>
              {options(listingSourceLabels, ["demo"])}
            </Select>
          </Field>
          <Field label="حالة التوفر" htmlFor="availabilityStatus">
            <Select id="availabilityStatus" name="availabilityStatus" defaultValue={initial.availabilityStatus}>
              {options(availabilityLabels)}
            </Select>
          </Field>
          <Field label="تاريخ آخر تحقق من التوفر" htmlFor="lastAvailabilityCheck" error={e.lastAvailabilityCheck}>
            <Input id="lastAvailabilityCheck" name="lastAvailabilityCheck" type="date" defaultValue={initial.lastAvailabilityCheck} dir="ltr" />
          </Field>
          <Field label="المراجعة القانونية" htmlFor="legalReviewStatus">
            <Select id="legalReviewStatus" name="legalReviewStatus" defaultValue={initial.legalReviewStatus}>
              {options(legalLabels)}
            </Select>
          </Field>
        </div>
      </section>

      <section className={section}>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={initial.published} />
          <span>منشور على الموقع (يتطلب صورة ووصفًا)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
          <Button href="/admin/properties" variant="secondary">
            رجوع للقائمة
          </Button>
        </div>
      </section>
    </form>
  );
}

const UNIT_TYPES = ["apartment", "villa", "townhouse", "twinhouse", "duplex", "land", "commercial"] as const;

export function ProjectForm({ initial }: { initial: ProjectFormValues }) {
  const { state, pending, onSubmit } = useAdminForm(saveProjectAction);
  const e = state.errors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <FormMessage state={state} />

      <section className={section}>
        <h2 className="text-lg font-medium">بيانات المشروع</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="اسم المشروع" htmlFor="name" error={e.name}>
            <Input id="name" name="name" defaultValue={initial.name} required maxLength={200} />
          </Field>
          <Field label="الرابط (slug) — اتركه فارغًا ليُنشأ تلقائيًا" htmlFor="slug" error={e.slug}>
            <Input id="slug" name="slug" defaultValue={initial.slug} maxLength={160} dir="ltr" />
          </Field>
          <Field label="المطور (اختياري)" htmlFor="developer">
            <Input id="developer" name="developer" defaultValue={initial.developer} />
          </Field>
          <Field label="المنطقة" htmlFor="areaId" error={e.areaId}>
            <Select id="areaId" name="areaId" defaultValue={initial.areaId}>
              {options(areaLabels)}
            </Select>
          </Field>
          <Field label="حالة التسليم" htmlFor="deliveryStatus" error={e.deliveryStatus}>
            <Select id="deliveryStatus" name="deliveryStatus" defaultValue={initial.deliveryStatus}>
              <option value="">غير محدد</option>
              {options(deliveryLabels)}
            </Select>
          </Field>
        </div>
        <Field label="الوصف" htmlFor="description" error={e.description}>
          <Textarea id="description" name="description" defaultValue={initial.description} rows={6} />
        </Field>
        <Field label="خطة السداد (اختياري)" htmlFor="paymentPlanNote">
          <Textarea id="paymentPlanNote" name="paymentPlanNote" defaultValue={initial.paymentPlanNote} />
        </Field>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">أنواع الوحدات</legend>
          <div className="flex flex-wrap gap-4">
            {UNIT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="unitTypes" value={type} defaultChecked={initial.unitTypes.includes(type)} />
                {propertyTypeLabels[type]}
              </label>
            ))}
          </div>
          {e.unitTypes ? <p className="text-xs text-red-700">{e.unitTypes}</p> : null}
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPrimarySales" defaultChecked={initial.isPrimarySales} />
          بيع مطور (أساسي)
        </label>
      </section>

      <section className={section}>
        <h2 className="text-lg font-medium">الصور</h2>
        <ImageManager name="images" kind="projects" initial={initial.images} defaultAlt={initial.name} error={e.images} />
      </section>

      <section className={section}>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={initial.published} />
          <span>منشور على الموقع (يتطلب صورة ووصفًا)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
          <Button href="/admin/projects" variant="secondary">
            رجوع للقائمة
          </Button>
        </div>
      </section>
    </form>
  );
}
