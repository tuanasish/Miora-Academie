# Changelog

## [2026-03-31] - Data Collection Complete
### Added
- `tcf_final/` folder with 4 clean JSON files for all TCF Canada skills
- `DATA_QUALITY_BUILD_NOTES.md` with detailed build instructions
- `.brain/` folder for project knowledge persistence

### Completed
- **Compréhension Écrite**: 40 tests, 1,560 MCQ (100%)
- **Compréhension Orale**: 40 tests, 1,560 MCQ (100%, 337 text-less options)
- **Expression Écrite**: 320 items (228 complete, 77 missing corrections)
- **Expression Orale**: 2,745 sujets, 2,741 corrections (99.85%)

## [2026-03-30] - Expression Orale Crawler
### Added
- `crawler_orale.js` V11 - RSC streaming parser with 4-strategy T-ref resolution
- `validate_v11.cjs` - Data quality validation tool
- `fix_artifacts.cjs` - Post-processing React DOM artifact cleaner
- `export_final.cjs` - Export all 4 skills to separate files

### Fixed
- 132 RSC chunk artifacts in extracted text (V10 → V11)
- 8 React DOM artifacts at end of text
- Aggressive cleanup cutting valid content (strip vs cut approach)

## [2026-03-30] - Initial Crawling
### Added
- `crawler_expression_full.js` - Expression Écrite crawler
- TCF Canada Compréhension data (Écrite + Orale)
