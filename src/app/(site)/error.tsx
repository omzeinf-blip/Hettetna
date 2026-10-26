"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">حصلت مشكلة غير متوقعة</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        نعتذر عن ذلك. جرّب مرة تانية، ولو المشكلة استمرت ارجع للرئيسية أو تواصل معنا.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-sm bg-forest px-5 py-2.5 text-sm text-ivory"
        >
          حاول مرة تانية
        </button>
        <Link href="/" className="rounded-sm border border-line bg-white px-5 py-2.5 text-sm">
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
