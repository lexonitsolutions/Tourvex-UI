"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ErrorState, RequirePermission, Skeleton } from "../../../_kit";
import { isAbortError, useAdminApi } from "../../../_lib/adminApi";
import { catalogConfig } from "../../_config";
import CatalogEditor from "../../_components/CatalogEditor";

export default function EditCatalogItemPage({ params }) {
  const { type, id } = use(params);
  const config = catalogConfig(type);
  if (!config) notFound();
  return (
    <RequirePermission permission="catalog.read">
      <Loader key={`${type}/${id}`} config={config} id={decodeURIComponent(id)} />
    </RequirePermission>
  );
}

function EditorSkeleton() {
  return (
    <div className="adm-cms adm-cat" aria-busy="true" aria-label="Loading editor">
      <Skeleton height={72} className="tw:rounded-2xl" />
      <div className="adm-cat-layout" style={{ marginTop: 16 }}>
        <Skeleton height={260} className="tw:rounded-2xl" />
        <Skeleton height={560} className="tw:rounded-2xl" />
      </div>
    </div>
  );
}

function Loader({ config, id }) {
  const api = useAdminApi();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ attempt: -1, record: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/${config.type}/admin/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((record) => setResult({ attempt, record, error: null }))
      .catch((error) => {
        if (!isAbortError(error)) setResult({ attempt, record: null, error });
      });
    return () => controller.abort();
  }, [api, config.type, id, attempt]);

  if (result.attempt !== attempt) return <EditorSkeleton />;
  if (result.error) {
    const missing = result.error.status === 404 || result.error.status === 400;
    return (
      <ErrorState
        title={missing ? `This ${config.singular} does not exist` : `Could not load the ${config.singular}`}
        description={missing ? "It may have been deleted, or the link is wrong." : result.error.message}
        onRetry={missing ? undefined : () => setAttempt((n) => n + 1)}
      />
    );
  }
  return <CatalogEditor key={result.attempt} config={config} record={result.record} />;
}
