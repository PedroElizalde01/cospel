"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRightLeft, Copy, EyeOff, GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FieldGroup, PassField } from "@/lib/pass/schema";
import { STYLE_SPECS, groupsFor, hiddenFieldIds } from "@/lib/pass/styles";
import { cn } from "@/lib/utils";
import { useBuilder } from "./store";
import { HintIcon } from "./ui";

function FieldRow({ field, group, hidden }: { field: PassField; group: FieldGroup; hidden: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const selected = useBuilder((s) => s.selectedFieldId === field.id);
  const style = useBuilder((s) => s.project!.style);
  const { select, updateField, removeField, duplicateField, moveField } = useBuilder.getState();
  const multiline = group === "back";
  const targets = groupsFor(style).filter((g) => g !== group);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onFocusCapture={() => select(field.id)}
      onClick={() => select(field.id)}
      data-field-row={field.id}
      className={cn(
        "group/row relative flex gap-1.5 rounded-lg border bg-background p-1.5 pr-1 transition-shadow",
        selected ? "border-accent-blue/60 ring-2 ring-accent-blue/20" : "border-border/70 hover:border-border",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${field.label || field.key}`}
        className="mt-1 flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <div className="min-w-0 flex-1 space-y-1">
        <Input
          aria-label="Label"
          placeholder="Label"
          value={field.label}
          onChange={(e) => updateField(field.id, { label: e.target.value }, "label")}
          className="h-7 border-transparent bg-transparent px-1.5 text-xs font-medium text-muted-foreground uppercase shadow-none hover:border-border focus-visible:border-ring dark:bg-transparent"
        />
        {multiline ? (
          <Textarea
            aria-label="Value"
            placeholder="Value"
            value={field.value}
            onChange={(e) => updateField(field.id, { value: e.target.value }, "value")}
            className="min-h-14 resize-y border-transparent bg-muted/50 px-1.5 py-1 text-sm shadow-none focus-visible:border-ring"
          />
        ) : (
          <Input
            aria-label="Value"
            placeholder="Value"
            value={field.value}
            onChange={(e) => updateField(field.id, { value: e.target.value }, "value")}
            className="h-8 border-transparent bg-muted/50 px-1.5 text-sm shadow-none focus-visible:border-ring"
          />
        )}
        {hidden && (
          <Badge variant="secondary" className="gap-1 text-[10px] font-normal text-amber-700 dark:text-amber-400">
            <EyeOff className="size-3" /> Not shown in Wallet
          </Badge>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="Field actions" className="opacity-60 group-hover/row:opacity-100 focus-visible:opacity-100">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => duplicateField(field.id)}><Copy /> Duplicate</DropdownMenuItem>
          {targets.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><ArrowRightLeft className="size-4" /> Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {targets.map((g) => (
                  <DropdownMenuItem key={g} onSelect={() => moveField(field.id, g)}>
                    {STYLE_SPECS[style].groups[g]!.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => removeField(field.id)}><Trash2 /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/** Sortable list for one field group. Reordering is constrained to the group; "Move to" crosses groups. */
export function FieldList({ group, title, hint, max }: { group: FieldGroup; title: string; hint?: string; max?: number }) {
  const fields = useBuilder((s) => s.project!.fields[group]);
  const project = useBuilder((s) => s.project!);
  const hidden = useMemo(() => hiddenFieldIds(project), [project]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const over = max !== undefined && fields.length > max;

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const to = fields.findIndex((f) => f.id === e.over!.id);
    useBuilder.getState().moveField(String(e.active.id), group, to);
  };

  return (
    <div className="space-y-2" data-group={group}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-medium">{title}</h3>
          {max !== undefined && (
            <span className={cn("text-[11px] tabular-nums", over ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
              {fields.length}/{max}
            </span>
          )}
          {hint && <HintIcon>{hint}</HintIcon>}
        </div>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => useBuilder.getState().addField(group)}
          disabled={max !== undefined && fields.length >= max && useBuilder.getState().accuracy}
          aria-label={`Add ${title.toLowerCase()} field`}
        >
          <Plus /> Add
        </Button>
      </div>
      {fields.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5">
              {fields.map((f) => (
                <FieldRow key={f.id} field={f} group={group} hidden={hidden.has(f.id)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <button
          type="button"
          onClick={() => useBuilder.getState().addField(group)}
          className="w-full rounded-lg border border-dashed border-border px-3 py-2.5 text-left text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        >
          No {title.toLowerCase()} fields yet. Add one.
        </button>
      )}
    </div>
  );
}
