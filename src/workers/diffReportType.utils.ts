export function registryReportTypeChanged(
  existingReportTypeId: string | null,
  reportTypeId: string
): boolean {
  return existingReportTypeId !== reportTypeId
}
