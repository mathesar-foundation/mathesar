export const upgradeApi = {
  /** @throws Error for some very limited failure scenarios. */
  async upgrade(): Promise<void> {
    const response = await fetch('/api/ui/v0/upgrade/', {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Unable to upgrade.');
    }
  },
};
