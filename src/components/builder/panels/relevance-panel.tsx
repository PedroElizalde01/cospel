"use client";

import { LocateFixed, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uid } from "@/lib/pass/schema";
import { useBuilder } from "../store";
import { FormRow, PanelHeader, Section } from "../ui";

/** ISO (UTC) <-> <input type="datetime-local"> in the editor's local time zone. */
const toLocalInput = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : "");

export function RelevancePanel() {
  const r = useBuilder((s) => s.project!.relevance);
  const update = useBuilder((s) => s.update);

  const addLocation = (lat = 0, lng = 0) =>
    update((d) => void d.relevance.locations.push({ id: uid(), name: "", latitude: lat, longitude: lng, relevantText: "" }));

  const useCurrent = () => {
    if (!navigator.geolocation) return toast.error("Location isn't available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => addLocation(Number(pos.coords.latitude.toFixed(6)), Number(pos.coords.longitude.toFixed(6))),
      () => toast.error("Couldn't get your location."),
    );
  };

  return (
    <>
      <PanelHeader title="Relevance" description="Help Wallet surface the pass at the right time and place. Wallet decides when to actually show it." />
      <Section title="Dates">
        <FormRow label="Relevant date" htmlFor="relevantDate" hint="E.g. event start. Wallet may surface the pass around this time.">
          <Input id="relevantDate" type="datetime-local" value={toLocalInput(r.relevantDate)} onChange={(e) => update((d) => void (d.relevance.relevantDate = fromLocalInput(e.target.value)))} />
        </FormRow>
        <FormRow label="Expiration date" htmlFor="expirationDate" hint="After this, Wallet marks the pass as expired.">
          <Input id="expirationDate" type="datetime-local" value={toLocalInput(r.expirationDate)} onChange={(e) => update((d) => void (d.relevance.expirationDate = fromLocalInput(e.target.value)))} />
        </FormRow>
      </Section>
      <Section
        title="Locations"
        hint="Up to 10. Enter coordinates directly. Address search appears when a geocoding provider is configured."
        actions={
          <div className="flex gap-1">
            <Button variant="ghost" size="xs" onClick={useCurrent}><LocateFixed /> Current</Button>
            <Button variant="ghost" size="xs" onClick={() => addLocation()}><Plus /> Add</Button>
          </div>
        }
      >
        {r.locations.length === 0 && <p className="text-xs text-muted-foreground">No locations. Add a store or venue to show the pass on the lock screen nearby.</p>}
        <ul className="space-y-2">
          {r.locations.map((l, i) => (
            <li key={l.id} id={`loc-${l.id}`} tabIndex={-1} className="space-y-2 rounded-lg border border-border/70 p-2.5">
              <div className="flex items-center gap-2">
                <Input aria-label={`Location ${i + 1} name`} placeholder="Name (for you)" value={l.name} onChange={(e) => update((d) => void (d.relevance.locations[i].name = e.target.value), `loc-name-${l.id}`)} className="h-8" />
                <Button variant="ghost" size="icon-sm" aria-label={`Remove location ${i + 1}`} onClick={() => update((d) => void d.relevance.locations.splice(i, 1))}><Trash2 /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input aria-label="Latitude" type="number" step="any" min={-90} max={90} placeholder="Latitude" value={l.latitude} onChange={(e) => update((d) => void (d.relevance.locations[i].latitude = Number(e.target.value)), `loc-lat-${l.id}`)} className="h-8" />
                <Input aria-label="Longitude" type="number" step="any" min={-180} max={180} placeholder="Longitude" value={l.longitude} onChange={(e) => update((d) => void (d.relevance.locations[i].longitude = Number(e.target.value)), `loc-lng-${l.id}`)} className="h-8" />
              </div>
              <Input aria-label="Lock screen text" placeholder="Lock screen text, e.g. “Your card is ready at North Coffee”" value={l.relevantText} onChange={(e) => update((d) => void (d.relevance.locations[i].relevantText = e.target.value), `loc-text-${l.id}`)} className="h-8" />
            </li>
          ))}
        </ul>
        {r.locations.length > 0 && (
          <FormRow label="Max distance (meters)" htmlFor="maxDistance" hint="Optional. Wallet may use a smaller radius.">
            <Input id="maxDistance" type="number" min={1} value={r.maxDistance ?? ""} onChange={(e) => update((d) => void (d.relevance.maxDistance = e.target.value ? Math.max(1, Number(e.target.value)) : null))} className="h-8" />
          </FormRow>
        )}
      </Section>
    </>
  );
}
