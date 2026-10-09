/** True if `index` names an existing logical monitor (there are none during early shell startup). */
export function valid_monitor(index: number, count: number): boolean {
    return index >= 0 && index < count;
}
