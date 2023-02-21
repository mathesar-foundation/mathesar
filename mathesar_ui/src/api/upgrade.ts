export const upgradeApi = {
  /** @throws Error for some very limited failure scenarios. */
  async upgrade(): Promise<void> {
    const response = await fetch('/api/ui/v0/upgrade/', {
      // TODO: this should be POST, but the backend doesn't support it yet.
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Unable to upgrade.');
    }
  },
};
