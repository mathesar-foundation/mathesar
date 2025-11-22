export function parseColumnId(id: unknown): number | null {
  if (id === null || id === undefined) {
    return null;
  }
  if (typeof id === "string" && id.trim() === "") {
    return null;
  }
  const parsed = Number(id);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}
export function safeParseNumber(value: unknown): number | null {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed === "") {
			return null;
		}
		const parsed = Number(trimmed);
		return Number.isNaN(parsed) ? null : parsed;
	}

	if (typeof value === "number") {
		return Number.isNaN(value) ? null : value;
	}

	return null;
}


