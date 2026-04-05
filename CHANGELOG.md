# Changelog

## 0.3.6

- Fix README GitHub URLs to use correct repo name (ts-micro-schema)

## 0.3.5

- Standardize README to 3-badge format with emoji Support section
- Update CI actions to v5 for Node.js 24 compatibility
- Add GitHub issue templates, dependabot config, and PR template

## 0.3.4

- Fix CI and License badge URLs in README

## 0.3.3

- Add Development section to README
- Fix CI badge to reference publish.yml

## 0.3.0
- Add `.strict()` mode for `ObjectSchema` — rejects objects with unknown keys
- Add `s.tuple()` schema type for fixed-length typed arrays
- Improve union error messages — individual schema errors are now included in the validation error

## 0.2.3

- Fix npm package name references in README

## 0.2.2

- Fix npm package name (restore original name without ts- prefix)

## 0.2.1

- Update repository URLs to new ts-prefixed GitHub repo

## 0.2.0

- Add comprehensive test suite (45 tests covering all schema types, modifiers, composites, error paths)
- Add CI workflow for push/PR testing
- Add test step to publish workflow
- Add API reference tables to README

## 0.1.0
- Initial release
