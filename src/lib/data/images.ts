const unsplash = (id: string, alt: string) => ({
  src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`,
  alt,
});

export const stockImages = {
  villaNight: unsplash(
    "photo-1600596542815-ffad4c1539a9",
    "واجهة فيلا حديثة بإضاءة مسائية",
  ),
  villaPool: unsplash(
    "photo-1613490493576-7fde63acd811",
    "فيلا سكنية بحديقة ومسبح",
  ),
  apartmentLiving: unsplash(
    "photo-1600210492486-724fe5c67fb0",
    "صالة معيشة مضيئة داخل شقة سكنية",
  ),
  apartmentKitchen: unsplash(
    "photo-1600585154526-990dced4db0d",
    "مطبخ مفتوح داخل وحدة سكنية",
  ),
  townhouse: unsplash(
    "photo-1600585154340-be6161a56a0c",
    "صف منازل تاون هاوس حديثة",
  ),
  duplexInterior: unsplash(
    "photo-1600607687939-ce8a6c25118c",
    "سلم داخلي في وحدة دوبلكس",
  ),
  landPlot: unsplash(
    "photo-1500382017468-9049fed747ef",
    "قطعة أرض فضاء محاطة بالأشجار",
  ),
  commercial: unsplash(
    "photo-1486406149826-c6acbbd1cc89",
    "واجهة مبنى تجاري حديث",
  ),
  compound: unsplash(
    "photo-1512917774080-9991f1c4c750",
    "مجمع سكني حديث بإضاءة داخلية دافئة",
  ),
  street: unsplash(
    "photo-1564013799919-ab600027ffc6",
    "منزل سكني بواجهة حجرية",
  ),
  bedroom: unsplash(
    "photo-1616594039964-ae9021a400a0",
    "غرفة نوم هادئة بإضاءة طبيعية",
  ),
  facade: unsplash(
    "photo-1600047509807-ba8f99d2cdbc",
    "واجهة منزل عصرية بحديقة أمامية",
  ),
};
