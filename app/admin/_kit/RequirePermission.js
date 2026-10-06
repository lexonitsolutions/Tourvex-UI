"use client";

import Link from "next/link";
import { useAdminMe } from "../_lib/AdminMeProvider";
import Icon from "./Icon";

/** "No access" state for a page the current staff member's role cannot open. The API enforces this too. */
export function NoAccess({ permission }) {
  return (
    <div className="adm-noaccess" role="alert">
      <span className="adm-empty__icon"><Icon name="lock" size={22} /></span>
      <h2 className="adm-empty__title">You do not have access to this page</h2>
      <p className="adm-empty__desc">
        Your role does not include {permission ? <code className="adm-code">{Array.isArray(permission) ? permission.join(" or ") : permission}</code> : "this permission"}. Ask a super admin if you need it.
      </p>
      <Link href="/admin" className="adm-btn adm-btn--secondary"><span className="adm-btn__label">Back to dashboard</span></Link>
    </div>
  );
}

export function RequirePermission({ permission, children }) {
  const { can } = useAdminMe();
  return can(permission) ? children : <NoAccess permission={permission} />;
}
