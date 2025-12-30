import { useContext } from "react";
import { FilterContext, type FilterContextValue } from "./FilterContextDef";

export function useFilterContext(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
}
