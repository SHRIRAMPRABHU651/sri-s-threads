"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DepartmentDef } from "@/lib/types";

const Ctx = createContext<DepartmentDef[]>([]);

/** The departments that are switched on, as set in Admin → Departments. Provided once by the shop layout. */
export function DepartmentsProvider({ departments, children }: { departments: DepartmentDef[]; children: ReactNode }) {
  return <Ctx.Provider value={departments}>{children}</Ctx.Provider>;
}
export const useDepartments = () => useContext(Ctx);
