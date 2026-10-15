"use client";

import { useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useAdminApi } from "../../_lib/adminApi";
import { useAdminQuery } from "../../_lib/useAdminQuery";
import { useAdminMe } from "../../_lib/AdminMeProvider";
import { Button, ConfirmDialog, ErrorState, Modal, PageHeader, RequirePermission, StatusBadge, useToast } from "../../_kit";
import { ImagePicker } from "../../content/_components/ImagePicker";
import { resolveMediaUrl } from "../../_lib/cms";

const EMPTY = { name: "", category: "Travel partner", logo: "", href: "", order: 0, published: true, placements: ["home", "activities"] };

function Editor({ item, onClose, onSaved }) {
  const api = useAdminApi();
  const toast = useToast();
  const [form, setForm] = useState(item ? { ...EMPTY, ...item } : EMPTY);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  async function save() {
    setBusy(true); setError("");
    const body = { name: form.name.trim(), category: form.category.trim(), logo: form.logo || null, href: form.href || null, order: Number(form.order) || 0, published: !!form.published, placements: ["home", "activities"] };
    try {
      if (item?.id) await api.patch(`/partners/${item.id}`, body); else await api.post("/partners", body);
      toast.success(item?.id ? "Partner logo updated" : "Partner logo added");
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <>
    <Modal open onClose={onClose} title={item ? "Edit partner logo" : "Add partner logo"} description="This logo updates every partnership showcase on the website." footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} disabled={!form.name.trim() || !form.category.trim()} onClick={save}>Save partner</Button></>}>
      <div className="adm-partner-form">
        <label><span>Partner name *</span><input value={form.name} maxLength={80} onChange={(e)=>set("name",e.target.value)} /></label>
        <label><span>Category *</span><input value={form.category} maxLength={40} onChange={(e)=>set("category",e.target.value)} /></label>
        <div><span className="adm-partner-label">Logo</span><div className="adm-partner-logo-pick">{form.logo ? <img src={resolveMediaUrl(form.logo)} alt="" /> : <ImagePlus size={28}/>}<Button size="sm" onClick={()=>setPicker(true)}>{form.logo ? "Replace logo" : "Choose logo"}</Button></div></div>
        <label><span>Website (optional)</span><input value={form.href || ""} placeholder="https://partner.com" onChange={(e)=>set("href",e.target.value)} /></label>
        <label><span>Display order</span><input type="number" min="0" max="999" value={form.order} onChange={(e)=>set("order",e.target.value)} /></label>
        <label className="adm-partner-check"><input type="checkbox" checked={form.published} onChange={(e)=>set("published",e.target.checked)} /><span>Published on the website</span></label>
        {error ? <p className="adm-field__error" role="alert">{error}</p> : null}
      </div>
    </Modal>
    {picker ? <ImagePicker current={form.logo ? { url: form.logo } : null} onClose={()=>setPicker(false)} onPick={(media)=>{set("logo",media.url);setPicker(false);}} /> : null}
  </>;
}

function PartnerLogoCatalog() {
  const api = useAdminApi(); const toast = useToast(); const { can } = useAdminMe();
  const list = useAdminQuery("/partners/admin/all", undefined, { prefetchNext:false });
  const [editing,setEditing]=useState(null); const [adding,setAdding]=useState(false); const [deleting,setDeleting]=useState(null); const [busy,setBusy]=useState(false);
  const canWrite=can("catalog.write"), canDelete=can("catalog.delete");
  async function remove(){setBusy(true);try{await api.delete(`/partners/${deleting.id}`);toast.success("Partner logo deleted");setDeleting(null);list.reload();}catch(e){toast.error(e.message);}finally{setBusy(false)}}
  return <>
    <PageHeader title="Partner logos" description="Manage the shared 3D partnership showcase. Changes appear on Home, About, Contact, Our Services, Partner With Us and all Visa pages." actions={canWrite?<Button variant="primary" onClick={()=>setAdding(true)}><Plus size={16}/> Add partner</Button>:null}/>
    {list.error?<ErrorState title="Could not load partner logos" description={list.error.message} onRetry={list.reload}/>:<div className="adm-partner-grid" aria-busy={list.loading}>
      {(list.data?.items||[]).map((item)=><article className="adm-partner-card" key={item.id}>
        <div className="adm-partner-card__logo">{item.logo?<img src={resolveMediaUrl(item.logo)} alt={item.name}/>:<span>{item.name.slice(0,2).toUpperCase()}</span>}</div>
        <div className="adm-partner-card__body"><div><h3>{item.name}</h3><p>{item.category}</p></div><StatusBadge tone={item.published?"success":"neutral"}>{item.published?"Published":"Hidden"}</StatusBadge></div>
        <div className="adm-partner-card__actions">{canWrite?<Button size="sm" onClick={()=>setEditing(item)}><Pencil size={14}/> Edit</Button>:null}{canDelete?<Button size="sm" variant="ghost" onClick={()=>setDeleting(item)}><Trash2 size={14}/> Delete</Button>:null}</div>
      </article>)}
      {!list.loading&&!list.data?.items?.length?<div className="adm-empty"><p className="adm-empty__title">No partner logos yet</p><p className="adm-empty__desc">Add your first logo to publish the showcase.</p></div>:null}
    </div>}
    {(adding||editing)?<Editor item={editing} onClose={()=>{setAdding(false);setEditing(null)}} onSaved={()=>{setAdding(false);setEditing(null);list.reload()}}/>:null}
    <ConfirmDialog open={!!deleting} onClose={()=>setDeleting(null)} onConfirm={remove} busy={busy} title={`Delete “${deleting?.name||"partner"}”?`} description="This removes the logo from every partnership showcase." confirmLabel="Delete"/>
  </>;
}

export default function PartnerLogosPage(){return <RequirePermission permission="catalog.read"><PartnerLogoCatalog/></RequirePermission>}
