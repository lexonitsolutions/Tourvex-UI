"use client";

import "../content.css";
import { use, useCallback, useEffect, useState } from "react";
import { ErrorState, RequirePermission, Skeleton } from "../../_kit";
import { isAbortError } from "../../_lib/adminApi";
import { readDocument, useCmsApi } from "../../_lib/cms";
import ContentEditor from "../_components/ContentEditor";

export default function ContentEditorPage({ params }) {
  const { key } = use(params);
  return (
    <RequirePermission permission="cms.read">
      <Loader docKey={decodeURIComponent(key)} />
    </RequirePermission>
  );
}

function EditorSkeleton() {
  return (
    <div className="adm-cms" aria-busy="true" aria-label="Loading editor">
      <Skeleton height={64} className="tw:rounded-2xl" />
      <div className="adm-cms-grid has-rail" style={{ marginTop: 16 }}>
        <Skeleton height={420} className="tw:rounded-2xl" />
        <Skeleton height={620} className="tw:rounded-2xl" />
      </div>
    </div>
  );
}

function Loader({ docKey }) {
  const cms = useCmsApi();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ attempt: -1, doc: null, error: null });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    cms
      .get(docKey, { signal: controller.signal })
      .then((res) => setResult({ attempt, doc: readDocument(res), error: null }))
      .catch((error) => {
        if (!isAbortError(error)) setResult({ attempt, doc: null, error });
      });
    return () => controller.abort();
  }, [cms, docKey, attempt]);

  // reloading (after discard / restore / publish / conflict) refetches and remounts the editor with fresh state
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  if (result.attempt !== attempt) return result.doc ? <ContentEditor key={result.attempt} doc={result.doc} initialSelected={selected} onSelectedChange={setSelected} onReload={reload} /> : <EditorSkeleton />;
  if (result.error) {
    return (
      <ErrorState
        title={result.error.status === 404 ? "This document does not exist" : "Could not load the editor"}
        description={result.error.message}
        onRetry={result.error.status === 404 ? undefined : reload}
      />
    );
  }
  return <ContentEditor key={result.attempt} doc={result.doc} initialSelected={selected} onSelectedChange={setSelected} onReload={reload} />;
}
