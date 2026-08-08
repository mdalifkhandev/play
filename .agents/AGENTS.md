
### Feed Loading Pattern Rule
- **Independent Section Loading**: Never use sequential \wait api1(); await api2();\ for data fetching in feeds or composite screens.
- **Parallel Fetching**: Use the \useFeedSection\ pattern for fetching data for each section independently.
- **Loading States**: Each section must have its own skeleton/shimmer loader (no global full-screen spinners for sections).
- **Error Handling**: If one section fails, handle it silently (hide or show a retry option for that specific section) without blocking or breaking the rest of the feed.
- **Reusability**: Apply the \useFeedSection\ pattern whenever adding new APIs or sections.
