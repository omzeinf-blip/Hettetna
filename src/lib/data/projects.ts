import { stockImages } from "@/lib/data/images";
import type { Project } from "@/lib/types";

export const demoProjects: Project[] = [
  {
    id: "project-demo-1",
    slug: "nakheel-demo-compound",
    name: "مشروع النخيل التجريبي",
    areaId: "6th-october",
    areaName: "6 أكتوبر",
    city: "الجيزة",
    description:
      "مشروع تجريبي لإظهار صفحة المشروعات والفرق بين البيع الأساسي وإعادة البيع. اسم المطور غير مذكور عمدًا لأنه غير موثّق.",
    deliveryStatus: "under-construction",
    paymentPlanNote: "أي إشارة لخطة سداد هنا للعرض فقط وليست عرضًا من مطور.",
    images: [stockImages.compound, stockImages.townhouse],
    isDemo: true,
    isPrimarySales: true,
    unitTypes: ["townhouse", "twinhouse", "villa"],
    publishedAt: "2026-04-11",
  },
  {
    id: "project-demo-2",
    slug: "zayed-gardens-demo",
    name: "حدائق زايد التجريبية",
    areaId: "sheikh-zayed",
    areaName: "الشيخ زايد",
    city: "الجيزة",
    description:
      "كمبوند نموذجي لعرض توزيع الوحدات في الشيخ زايد. لا توجد شراكة معلنة مع جهة تطوير.",
    deliveryStatus: "ready",
    images: [stockImages.villaPool, stockImages.facade],
    isDemo: true,
    isPrimarySales: true,
    unitTypes: ["apartment", "duplex"],
    publishedAt: "2026-03-02",
  },
  {
    id: "project-demo-3",
    slug: "new-zayed-courtyard-demo",
    name: "فناء زايد الجديدة التجريبي",
    areaId: "new-zayed",
    areaName: "زايد الجديدة",
    city: "الجيزة",
    description:
      "نموذج لمشروع في زايد الجديدة يساعد على تجربة الفلاتر والتنقل. البيانات ليست مخزونًا حقيقيًا.",
    deliveryStatus: "under-construction",
    images: [stockImages.street, stockImages.compound],
    isDemo: true,
    isPrimarySales: true,
    unitTypes: ["apartment", "commercial"],
    publishedAt: "2026-01-18",
  },
];
