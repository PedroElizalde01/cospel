"use client";

import { Wifi } from "lucide-react";
import { useState } from "react";
import { BarcodeImage } from "@/components/pass/barcode-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BARCODE_PRESETS, BARCODE_SPECS, wifiPayload } from "@/lib/pass/barcode";
import { BARCODE_FORMATS, minIOSFor, type BarcodeFormat } from "@/lib/pass/schema";
import { useBuilder } from "../store";
import { FormRow, HintIcon, PanelHeader, Section } from "../ui";

function WifiPreset({ onApply }: { onApply: (msg: string) => void }) {
  const [ssid, setSsid] = useState("");
  const [pw, setPw] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs"><Wifi /> Wi-Fi</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-2">
        <Input aria-label="Network name" placeholder="Network name" value={ssid} onChange={(e) => setSsid(e.target.value)} />
        <Input aria-label="Password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button
          size="sm"
          className="w-full"
          disabled={!ssid}
          onClick={() => {
            onApply(wifiPayload(ssid, pw, pw ? "WPA" : "nopass"));
            setOpen(false);
          }}
        >
          Use Wi-Fi code
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function BarcodePanel() {
  const bc = useBuilder((s) => s.project!.barcode);
  const compat = useBuilder((s) => s.project!.compatibility);
  const update = useBuilder((s) => s.update);
  const set = (patch: Partial<typeof bc>, coalesce?: string) => update((d) => void Object.assign(d.barcode, patch), coalesce);
  const spec = BARCODE_SPECS[bc.format];
  const needsFallback = spec.minIOS > minIOSFor(compat);
  const legacy = BARCODE_FORMATS.filter((f) => BARCODE_SPECS[f].minIOS < 27);
  const modern = BARCODE_FORMATS.filter((f) => BARCODE_SPECS[f].minIOS >= 27);

  return (
    <>
      <PanelHeader title="Barcode" description="Rendered live in your browser." />
      <Section>
        <div className="flex items-center justify-between">
          <label htmlFor="barcode-enabled" className="text-sm font-medium">Show a barcode</label>
          <Switch id="barcode-enabled" checked={bc.enabled} onCheckedChange={(enabled) => set({ enabled })} />
        </div>
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          The code contains the data you specify. Your business system must know how to interpret or redeem it.
        </p>
      </Section>
      {bc.enabled && (
        <>
          <Section title="Format">
            <Select value={bc.format} onValueChange={(v) => set({ format: v as BarcodeFormat })}>
              <SelectTrigger id="barcode-format" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>All Wallet versions</SelectLabel>
                  {legacy.map((f) => <SelectItem key={f} value={f}>{BARCODE_SPECS[f].name}</SelectItem>)}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>iOS 27 and later</SelectLabel>
                  {modern.map((f) => <SelectItem key={f} value={f}>{BARCODE_SPECS[f].name}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            {needsFallback && (
              <FormRow label="Fallback for older iPhones" htmlFor="barcode-fallback" hint={`${spec.name} needs iOS ${spec.minIOS}. Older Wallet versions show the fallback instead.`}>
                <Select value={bc.fallbackFormat ?? "none"} onValueChange={(v) => set({ fallbackFormat: v === "none" ? null : (v as "qr") })}>
                  <SelectTrigger id="barcode-fallback" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No fallback</SelectItem>
                    {legacy.map((f) => <SelectItem key={f} value={f}>{BARCODE_SPECS[f].name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormRow>
            )}
          </Section>
          <Section title="Content">
            <div className="flex flex-wrap gap-1.5">
              {BARCODE_PRESETS.map((pr) => (
                <Button key={pr.id} variant="outline" size="xs" onClick={() => set({ message: pr.message, altText: pr.altText })}>{pr.label}</Button>
              ))}
              <WifiPreset onApply={(message) => set({ message, altText: "" })} />
            </div>
            <FormRow label="Message" htmlFor="barcode-message" hint="The exact data inside the code, e.g. a member ID or URL.">
              <Textarea id="barcode-message" value={bc.message} onChange={(e) => set({ message: e.target.value }, "barcode-message")} className="min-h-16 font-mono text-xs" spellCheck={false} />
            </FormRow>
            <FormRow label="Text under the code" htmlFor="barcode-alt" hint="Optional. Helps staff type the code if scanning fails.">
              <Input id="barcode-alt" value={bc.altText} onChange={(e) => set({ altText: e.target.value }, "barcode-alt")} />
            </FormRow>
            <FormRow label="Encoding" htmlFor="barcode-encoding">
              <div className="flex items-center gap-2">
                <Select value={bc.encoding} onValueChange={(v) => set({ encoding: v as typeof bc.encoding })}>
                  <SelectTrigger id="barcode-encoding" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iso-8859-1">ISO-8859-1 (recommended)</SelectItem>
                    <SelectItem value="utf-8">UTF-8</SelectItem>
                  </SelectContent>
                </Select>
                <HintIcon>Most scanners expect ISO-8859-1. Use UTF-8 only if your scanner needs it.</HintIcon>
              </div>
            </FormRow>
          </Section>
          <Section title="Preview">
            <div className="flex justify-center rounded-lg border border-border/60 bg-white p-4">
              <BarcodeImage format={bc.format} message={bc.message} className={spec.shape === "square" ? "size-32" : "h-16 w-full max-w-60"} />
            </div>
          </Section>
        </>
      )}
    </>
  );
}
