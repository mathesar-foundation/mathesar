import arxiv

search = arxiv.Search(
  max_results = 50,
  sort_by = arxiv.SortCriterion.LastUpdated
)

for result in search.results():
  print(result.title)

