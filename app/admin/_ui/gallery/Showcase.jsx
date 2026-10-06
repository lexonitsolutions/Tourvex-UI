"use client";

import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircleIcon, BellIcon, CalendarDaysIcon, CopyIcon, DownloadIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon, UserIcon,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/admin/_ui/components/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/app/admin/_ui/components/alert-dialog";
import { Avatar, AvatarFallback } from "@/app/admin/_ui/components/avatar";
import { Badge } from "@/app/admin/_ui/components/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/app/admin/_ui/components/breadcrumb";
import { Button } from "@/app/admin/_ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/admin/_ui/components/card";
import { AreaChartLite, BarChartLite, ChartContainer, ChartLegend } from "@/app/admin/_ui/components/chart";
import { Checkbox } from "@/app/admin/_ui/components/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/admin/_ui/components/collapsible";
import { DateRangePicker } from "@/app/admin/_ui/components/date-range-picker";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/app/admin/_ui/components/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from "@/app/admin/_ui/components/dropdown-menu";
import { Input } from "@/app/admin/_ui/components/input";
import { Label } from "@/app/admin/_ui/components/label";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/app/admin/_ui/components/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/admin/_ui/components/popover";
import { Progress } from "@/app/admin/_ui/components/progress";
import { RadioGroup, RadioGroupItem } from "@/app/admin/_ui/components/radio-group";
import { ScrollArea } from "@/app/admin/_ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/admin/_ui/components/select";
import { Separator } from "@/app/admin/_ui/components/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/app/admin/_ui/components/sheet";
import { Skeleton } from "@/app/admin/_ui/components/skeleton";
import { Switch } from "@/app/admin/_ui/components/switch";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/app/admin/_ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/admin/_ui/components/tabs";
import { Textarea } from "@/app/admin/_ui/components/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/admin/_ui/components/tooltip";
import { DataTable } from "@/app/admin/_ui/data-table";
import { makeRows, TREND } from "./sample-data";

const CommandPalette = lazy(() => import("@/app/admin/_ui/components/command-palette").then((m) => ({ default: m.CommandPalette })));
const Calendar = lazy(() => import("@/app/admin/_ui/components/calendar").then((m) => ({ default: m.Calendar })));

const STATUS_BADGE = { confirmed: "success", pending: "warning", cancelled: "danger", refunded: "info" };
const money = (v) => v.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TINTS = ["mint", "butter", "peach", "rose", "periwinkle", "sky", "violet", "teal"];

function Section({ title, hint, children }) {
  return (
    <section className="tw:space-y-3">
      <div>
        <h3 className="tw:text-base tw:font-semibold tw:text-foreground">{title}</h3>
        {hint ? <p className="tw:text-xs tw:text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

const baseColumns = [
  { accessorKey: "ref", header: "Reference", meta: { label: "Reference" }, cell: ({ getValue }) => <span className="tw:font-mono tw:text-xs">{getValue()}</span> },
  { accessorKey: "customer", header: "Customer (sample)", meta: { label: "Customer" } },
  { accessorKey: "product", header: "Product", meta: { label: "Product" } },
  { accessorKey: "status", header: "Status", meta: { label: "Status" }, cell: ({ getValue }) => <Badge variant={STATUS_BADGE[getValue()]}>{getValue()}</Badge> },
  { accessorKey: "total", header: "Total (AED)", meta: { label: "Total", align: "right" }, cell: ({ getValue }) => <span className="tw:tabular-nums">{money(getValue())}</span> },
  { accessorKey: "created", header: "Created", meta: { label: "Created" } },
];

/** Server-driven demo: a fake API (setTimeout) owns sorting + paging + search; the table is `manual`. */
function ServerTableDemo({ id }) {
  const all = useMemo(() => makeRows(237, 11), []);
  const [sorting, setSorting] = useState([{ id: "created", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [q, setQ] = useState("");
  const [fail, setFail] = useState(false);
  const [nonce, setNonce] = useState(0);
  const reqKey = JSON.stringify([sorting, pagination, q, fail, nonce]);
  const [state, setState] = useState({ key: null, rows: [], total: 0, error: null });
  const loading = state.key !== reqKey;

  useEffect(() => {
    const t = setTimeout(() => {
      if (fail) return setState({ key: reqKey, rows: [], total: 0, error: "Sample API returned 503 (simulated)." });
      let rows = all.filter((r) => !q || (r.customer + r.ref + r.product).toLowerCase().includes(q.toLowerCase()));
      const s = sorting[0];
      if (s) rows = [...rows].sort((a, b) => (a[s.id] > b[s.id] ? 1 : a[s.id] < b[s.id] ? -1 : 0) * (s.desc ? -1 : 1));
      const start = pagination.pageIndex * pagination.pageSize;
      setState({ key: reqKey, rows: rows.slice(start, start + pagination.pageSize), total: rows.length, error: null });
    }, 550);
    return () => clearTimeout(t);
  }, [reqKey, all, sorting, pagination, q, fail]);

  return (
    <DataTable
      label="Server-driven sample table"
      columns={baseColumns}
      data={state.rows}
      getRowId={(r) => r.id}
      manual
      rowCount={state.total}
      sorting={sorting}
      onSortingChange={(s) => { setSorting(s); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
      pagination={pagination}
      onPaginationChange={setPagination}
      loading={loading}
      error={state.error}
      onRetry={() => { setFail(false); setNonce((n) => n + 1); }}
      enableRowSelection
      storageKey={`gallery-server-${id}`}
      maxHeight={null}
      toolbar={
        <>
          <div className="tw:relative">
            <SearchIcon className="tw:pointer-events-none tw:absolute tw:top-2.5 tw:left-2.5 tw:size-4 tw:text-muted-foreground" aria-hidden />
            <Input aria-label="Search sample rows" placeholder="Search sample rows" className="tw:h-9 tw:w-56 tw:pl-8" value={q} onChange={(e) => { setQ(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }} />
          </div>
          <Button variant="outline" size="sm" onClick={() => setFail((f) => !f)}>{fail ? "Stop simulating error" : "Simulate error"}</Button>
        </>
      }
      bulkActions={({ count, clear }) => (
        <div className="tw:flex tw:items-center tw:gap-2 tw:rounded-md tw:bg-accent tw:px-2 tw:py-1 tw:text-sm tw:text-accent-foreground">
          {count} selected <Button size="xs" variant="ghost" onClick={clear}>Clear</Button>
        </div>
      )}
      rowActions={(row) => [
        { label: "View", icon: UserIcon, onSelect: () => toast(`View ${row.ref} (sample)`) },
        { label: "Edit", icon: PencilIcon, onSelect: () => toast(`Edit ${row.ref} (sample)`) },
        { label: "Delete", icon: Trash2Icon, destructive: true, separatorBefore: true, onSelect: () => toast.error(`Deleted ${row.ref} (sample)`) },
      ]}
      onRowClick={(row) => toast(`Row clicked: ${row.ref}`)}
    />
  );
}

function VirtualTableDemo({ id }) {
  const data = useMemo(() => makeRows(5000, 5), []);
  return (
    <DataTable
      label="5,000 row virtualized sample table"
      columns={baseColumns}
      data={data}
      getRowId={(r) => r.id}
      paginate={false}
      enableRowSelection
      storageKey={`gallery-virtual-${id}`}
      maxHeight="420px"
    />
  );
}

export default function Showcase({ id }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [range, setRange] = useState({ from: new Date(2026, 9, 1), to: new Date(2026, 9, 7) });
  const [day, setDay] = useState(new Date(2026, 9, 6));
  const [prog, setProg] = useState(64);
  const [openC, setOpenC] = useState(false);
  const chartConfig = useMemo(() => ({ sales: { label: "Sales", color: "var(--chart-1)" }, refunds: { label: "Refunds", color: "var(--chart-5)" } }), []);
  useEffect(() => { const t = setInterval(() => setProg((p) => (p >= 96 ? 22 : p + 7)), 2200); return () => clearInterval(t); }, []);

  const groups = [
    { heading: "Navigate (sample)", items: [
      { id: "dash", label: "Dashboard", icon: CalendarDaysIcon, shortcut: "G D", onSelect: () => toast("Go to Dashboard") },
      { id: "bk", label: "Bookings", icon: BellIcon, shortcut: "G B", onSelect: () => toast("Go to Bookings") },
    ] },
    { heading: "Actions", items: [{ id: "new", label: "New booking", icon: PlusIcon, onSelect: () => toast("New booking") }] },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="tw:space-y-8 tw:p-4 tw:sm:p-6" data-showcase={id}>
        <Section title="Buttons, badges" hint="sample data throughout">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm"><DownloadIcon aria-hidden /> Export</Button>
            <Button size="icon" variant="outline" aria-label="Add"><PlusIcon aria-hidden /></Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <Badge>Default</Badge><Badge variant="secondary">Secondary</Badge><Badge variant="outline">Outline</Badge>
            <Badge variant="success">Confirmed</Badge><Badge variant="warning">Pending</Badge><Badge variant="info">Refunded</Badge><Badge variant="danger">Cancelled</Badge>
          </div>
        </Section>

        <Section title="Pastel tints (--adm-tint-*)">
          <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:sm:grid-cols-4">
            {TINTS.map((t) => (
              <div key={t} className="tw:rounded-lg tw:border tw:px-3 tw:py-2 tw:text-sm tw:font-medium" style={{ background: `var(--adm-tint-${t})`, color: `var(--adm-tint-${t}-ink)`, borderColor: `var(--adm-tint-${t}-ring)` }}>
                {t}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Form controls">
          <div className="tw:grid tw:gap-4 tw:sm:grid-cols-2">
            <div className="tw:grid tw:gap-1.5"><Label htmlFor={`${id}-name`}>Full name</Label><Input id={`${id}-name`} placeholder="Sample Customer" /></div>
            <div className="tw:grid tw:gap-1.5"><Label htmlFor={`${id}-bad`}>Email (invalid)</Label><Input id={`${id}-bad`} aria-invalid defaultValue="not-an-email" /></div>
            <div className="tw:grid tw:gap-1.5">
              <Label htmlFor={`${id}-sel`}>Status</Label>
              <Select defaultValue="pending">
                <SelectTrigger id={`${id}-sel`} className="tw:w-full"><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="tw:grid tw:gap-1.5"><Label htmlFor={`${id}-ta`}>Notes</Label><Textarea id={`${id}-ta`} placeholder="Internal note (sample)" /></div>
            <div className="tw:flex tw:items-center tw:gap-2"><Checkbox id={`${id}-c1`} defaultChecked /><Label htmlFor={`${id}-c1`}>Send voucher by email</Label></div>
            <div className="tw:flex tw:items-center tw:gap-2"><Checkbox id={`${id}-c2`} checked="indeterminate" /><Label htmlFor={`${id}-c2`}>Indeterminate</Label></div>
            <div className="tw:flex tw:items-center tw:gap-2"><Switch id={`${id}-sw`} defaultChecked /><Label htmlFor={`${id}-sw`}>Live inventory</Label></div>
            <RadioGroup defaultValue="card" className="tw:flex tw:gap-4" aria-label="Payment method">
              <div className="tw:flex tw:items-center tw:gap-2"><RadioGroupItem value="card" id={`${id}-r1`} /><Label htmlFor={`${id}-r1`}>Card</Label></div>
              <div className="tw:flex tw:items-center tw:gap-2"><RadioGroupItem value="cash" id={`${id}-r2`} /><Label htmlFor={`${id}-r2`}>Cash</Label></div>
            </RadioGroup>
          </div>
        </Section>

        <Section title="Tabs, accordion, collapsible">
          <Tabs defaultValue="a">
            <TabsList><TabsTrigger value="a">Overview</TabsTrigger><TabsTrigger value="b">Guests</TabsTrigger><TabsTrigger value="c">Notes</TabsTrigger></TabsList>
            <TabsContent value="a" className="tw:text-sm tw:text-muted-foreground">Overview panel (sample).</TabsContent>
            <TabsContent value="b" className="tw:text-sm tw:text-muted-foreground">Guests panel (sample).</TabsContent>
            <TabsContent value="c" className="tw:text-sm tw:text-muted-foreground">Notes panel (sample).</TabsContent>
          </Tabs>
          <Accordion type="single" collapsible defaultValue="i1">
            <AccordionItem value="i1"><AccordionTrigger>What is a sample booking?</AccordionTrigger><AccordionContent>Placeholder content for the accordion.</AccordionContent></AccordionItem>
            <AccordionItem value="i2"><AccordionTrigger>Second item</AccordionTrigger><AccordionContent>More placeholder content.</AccordionContent></AccordionItem>
          </Accordion>
          <Collapsible open={openC} onOpenChange={setOpenC}>
            <CollapsibleTrigger asChild><Button variant="outline" size="sm">{openC ? "Hide" : "Show"} details</Button></CollapsibleTrigger>
            <CollapsibleContent className="tw:mt-2 tw:rounded-md tw:border tw:p-3 tw:text-sm">Collapsible details (sample).</CollapsibleContent>
          </Collapsible>
        </Section>

        <Section title="Card, avatar, progress, skeleton, breadcrumb, pagination, separator">
          <div className="tw:grid tw:gap-4 tw:md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Revenue (sample)</CardTitle><CardDescription>Last 7 days</CardDescription></CardHeader>
              <CardContent className="tw:space-y-3">
                <div className="tw:text-3xl tw:font-semibold tw:tabular-nums">AED 124,500</div>
                <Progress value={prog} aria-label="Target progress" />
                <div className="tw:flex tw:items-center tw:gap-2"><Avatar><AvatarFallback>SC</AvatarFallback></Avatar><span className="tw:text-sm">Sample Customer</span></div>
              </CardContent>
              <CardFooter className="tw:text-xs tw:text-muted-foreground">Updated just now</CardFooter>
            </Card>
            <Card>
              <CardHeader><CardTitle>Loading</CardTitle><CardDescription>Skeleton placeholders</CardDescription></CardHeader>
              <CardContent className="tw:space-y-2"><Skeleton className="tw:h-5 tw:w-2/3" /><Skeleton className="tw:h-4 tw:w-full" /><Skeleton className="tw:h-4 tw:w-5/6" /></CardContent>
            </Card>
          </div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#">Admin</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="#">Bookings</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>SMP-100042</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Separator />
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
              <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
              <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
              <PaginationItem><PaginationEllipsis /></PaginationItem>
              <PaginationItem><PaginationNext href="#" /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </Section>

        <Section title="Overlays" hint="Portalled into the admin root so tokens, font and theme apply.">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm">Tooltip</Button></TooltipTrigger><TooltipContent>Helpful hint</TooltipContent></Tooltip>
            <Popover>
              <PopoverTrigger asChild><Button variant="outline" size="sm">Popover</Button></PopoverTrigger>
              <PopoverContent className="tw:text-sm">Popover content (sample).</PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Dropdown</Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Booking</DropdownMenuLabel><DropdownMenuSeparator />
                <DropdownMenuItem><CopyIcon aria-hidden /> Copy reference <DropdownMenuShortcut>Ctrl C</DropdownMenuShortcut></DropdownMenuItem>
                <DropdownMenuItem variant="destructive"><Trash2Icon aria-hidden /> Cancel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog>
              <DialogTrigger asChild><Button variant="outline" size="sm">Dialog</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit guest (sample)</DialogTitle><DialogDescription>Update the lead guest details.</DialogDescription></DialogHeader>
                <div className="tw:grid tw:gap-1.5"><Label htmlFor={`${id}-dn`}>Name</Label><Input id={`${id}-dn`} defaultValue="Sample Customer" /></div>
                <DialogFooter><Button variant="outline">Cancel</Button><Button onClick={() => toast.success("Saved (sample)")}>Save</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" size="sm">Alert dialog</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Cancel this booking?</AlertDialogTitle><AlertDialogDescription>This sample action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Keep</AlertDialogCancel><AlertDialogAction>Cancel booking</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Sheet>
              <SheetTrigger asChild><Button variant="outline" size="sm">Sheet (drawer)</Button></SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Filters (sample)</SheetTitle><SheetDescription>Narrow the list.</SheetDescription></SheetHeader>
                <div className="tw:grid tw:gap-3 tw:px-4"><Label htmlFor={`${id}-sh`}>Customer</Label><Input id={`${id}-sh`} placeholder="Sample" /></div>
                <SheetFooter><Button>Apply</Button></SheetFooter>
              </SheetContent>
            </Sheet>
            <Button variant="outline" size="sm" onClick={() => toast.success("Booking confirmed (sample)", { description: "Toast via sonner" })}>Toast</Button>
            <Button variant="outline" size="sm" onClick={() => toast.error("Payment failed (sample)")}><AlertCircleIcon aria-hidden /> Error toast</Button>
            <Button variant="outline" size="sm" onClick={() => setPaletteOpen(true)}>Command palette <kbd className="tw:ml-1 tw:rounded tw:border tw:px-1 tw:text-[10px]">Ctrl K</kbd></Button>
          </div>
          {paletteOpen ? (
            <Suspense fallback={null}>
              <CommandPalette groups={groups} open={paletteOpen} onOpenChange={setPaletteOpen} hotkey={false} />
            </Suspense>
          ) : null}
        </Section>

        <Section title="Calendar + date range picker (lazy)">
          <div className="tw:flex tw:flex-wrap tw:items-start tw:gap-4">
            <DateRangePicker value={range} onChange={setRange} />
            <div className="tw:rounded-lg tw:border">
              <Suspense fallback={<Skeleton className="tw:h-72 tw:w-72" />}>
                <Calendar mode="single" selected={day} onSelect={setDay} defaultMonth={day} />
              </Suspense>
            </div>
          </div>
        </Section>

        <Section title="Table + scroll area">
          <div className="tw:rounded-lg tw:border">
            <Table>
              <TableCaption>Static sample table</TableCaption>
              <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Status</TableHead><TableHead className="tw:text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {makeRows(4, 3).map((r) => (
                  <TableRow key={r.id}><TableCell className="tw:font-mono tw:text-xs">{r.ref}</TableCell><TableCell><Badge variant={STATUS_BADGE[r.status]}>{r.status}</Badge></TableCell><TableCell className="tw:text-right tw:tabular-nums">{money(r.total)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollArea className="tw:h-24 tw:rounded-md tw:border tw:p-3">
            {Array.from({ length: 12 }, (_, i) => <div key={i} className="tw:py-1 tw:text-sm">Scrollable line {i + 1} (sample)</div>)}
          </ScrollArea>
        </Section>

        <Section title="Charts (dependency-free SVG)" hint="No recharts: ~0 kB extra. Series colours come from --chart-1..5.">
          <div className="tw:grid tw:gap-4 tw:md:grid-cols-2">
            <ChartContainer config={chartConfig}><AreaChartLite data={TREND} keys={["sales", "refunds"]} /><ChartLegend /></ChartContainer>
            <ChartContainer config={chartConfig}><BarChartLite data={TREND} keys={["sales", "refunds"]} stacked /><ChartLegend /></ChartContainer>
          </div>
        </Section>

        <Section title="DataTable: server-driven (manual sorting / paging / search)" hint="Fake API with 550 ms latency. Try sorting, paging, the Columns menu (persisted), density, selection, row actions, and the error state.">
          <ServerTableDemo id={id} />
        </Section>

        <Section title="DataTable: 5,000 rows, virtualized" hint="Client-side. Only the visible window is mounted (see data-virtual-rows).">
          <VirtualTableDemo id={id} />
        </Section>
      </div>
    </TooltipProvider>
  );
}
