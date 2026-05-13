"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type FilterItem = {
  id: string;
  name: string;
  color?: string;
};

type CalendarFiltersProps = {
  teachers: FilterItem[];
  courses: FilterItem[];
  rooms: FilterItem[];
  selectedTeachers: string[];
  selectedCourses: string[];
  selectedRooms: string[];
  onTeacherChange: (id: string) => void;
  onCourseChange: (id: string) => void;
  onRoomChange: (id: string) => void;
};

export function CalendarFilters({
  teachers,
  courses,
  rooms,
  selectedTeachers,
  selectedCourses,
  selectedRooms,
  onTeacherChange,
  onCourseChange,
  onRoomChange
}: CalendarFiltersProps) {
  return (
    <div className="w-64 border-r border-border bg-white flex flex-col h-full overflow-hidden">
      <div className="p-4 font-bold text-lg border-b border-border">Filtri</div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Teachers */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Insegnanti</h3>
            <div className="space-y-2">
              {teachers.map((t) => (
                <div key={t.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`t-${t.id}`} 
                    checked={selectedTeachers.includes(t.id)}
                    onCheckedChange={() => onTeacherChange(t.id)}
                  />
                  <Label htmlFor={`t-${t.id}`} className="text-sm font-medium cursor-pointer">
                    {t.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Courses */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Corsi</h3>
            <div className="space-y-2">
              {courses.map((c) => (
                <div key={c.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`c-${c.id}`} 
                    checked={selectedCourses.includes(c.id)}
                    onCheckedChange={() => onCourseChange(c.id)}
                  />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || "#E8621A" }} />
                  <Label htmlFor={`c-${c.id}`} className="text-sm font-medium cursor-pointer truncate max-w-[160px]">
                    {c.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Rooms */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Aule</h3>
            <div className="space-y-2">
              {rooms.map((r) => (
                <div key={r.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`r-${r.id}`} 
                    checked={selectedRooms.includes(r.id)}
                    onCheckedChange={() => onRoomChange(r.id)}
                  />
                  <Label htmlFor={`r-${r.id}`} className="text-sm font-medium cursor-pointer">
                    {r.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
