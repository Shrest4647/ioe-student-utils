# TU grade converter methodology

Last reviewed: 2026-07-12

## Product boundary

This is a planning tool for shortlisting programmes and checking rough academic eligibility. It is not a credential evaluation, does not certify equivalence, and must not present its output as an official WES, university, or government result.

The awarded TU percentage, division, letter grade, or GPA remains the source of truth. When a destination institution publishes a Nepal- or TU-specific threshold, students should compare their original result with that threshold instead of converting it.

TU GPA and TU CGPA are separate input choices in the interface. Both retain their awarded 4.0 scale; CGPA is limited to the overall-result workflow because it is already cumulative.

## Supported decisions

### United States and Canada

- An awarded TU GPA on a 4-point scale is preserved without re-conversion.
- A TU percentage is mapped to TU's published semester letter-grade bands, then to the standard WES letter-grade quality points.
- In course mode, grade points are weighted by the credits entered by the student.
- The result is labelled a method-based planning estimate. It is not labelled a WES GPA because WES uses country and grading-scale context that this app cannot reproduce from a score alone.

### Germany

- Uses the modified Bavarian formula: `1 + 3 × (best grade - achieved grade) / (best grade - lowest passing grade)`.
- Percentage mode uses 100 as the best grade and the student-selected programme pass mark.
- TU GPA mode uses 4.0 as the best grade and 2.7 as TU's published lowest passing GPA for the referenced semester system.
- The output is non-binding; institutions can use different source values and rounding rules.

### United Kingdom, Australia, and India

- The original TU result is preserved.
- No synthetic UK classification, Australian 7-point GPA, or Indian 10-point CGPA is created.
- The result directs the student to the target institution's country-equivalency or international-admissions rules.

### Europe and ECTS

- The original TU result is preserved.
- The tool does not generate an ECTS letter grade. Current European guidance prefers programme-level grade-distribution tables, and ECTS itself primarily represents workload and credit transfer.

### Additional destination context

Japan, South Korea, Norway, Denmark, Finland, Ireland, France, Spain, Singapore, Malaysia, China, and Portugal are supported as destination guides. The tool shows the commonly encountered local grading context but preserves the original TU result because these countries do not provide one universal TU conversion formula.

The IFMA international-equivalencies reference and Learnsic overview are used as discovery and comparison sources. Wherever available, country authorities or university grading policies are linked beside the result and take precedence over those general references.

## Primary and institutional references

- [Tribhuvan University semester grading guidance](https://portal.tu.edu.np/downloads/Semester-System-Operational-Gu_2023_07_07_14_55_50.pdf)
- [WES standard letter-grade quality points](https://applications.wes.org/accesswes/pages/TermsConds.pdf)
- [WES on preview tools versus official evaluation](https://www.wes.org/resource-library/blog/credential-advice/helpful-tools-for-your-credential-evaluation/)
- [TUM modified Bavarian formula](https://www.tum.de/en/studies/application/application-info-portal/grade-conversion-formula-for-grades-earned-outside-germany)
- [European Commission guidance on ECTS grade conversion](https://erasmus-plus.ec.europa.eu/cs/eche/a-common-approach-to-ects-grade-conversion-ensuring-a-fair-assessment-of-student-performance-after-study-abroad)
- [University of Surrey requirements for Nepal](https://www.surrey.ac.uk/nepal/entry-requirements)
- [University of Warwick requirements for Nepal](https://warwick.ac.uk/study/international/countryinformation/southasia/nepal/)
- [RMIT country equivalency for Nepal](https://www.rmit.edu.au/study-with-us/international-students/apply-to-rmit-international-students/entry-requirements/country-equivalency/nepal)
- [UGC choice-based credit system guidance](https://www.ugc.gov.in/pdfnews/8023719_Guidelines-for-CBCS.pdf)
- [IFMA international grade-equivalencies reference](https://foundation.ifma.org/wp-content/uploads/2019/11/International-Grade-Equivalencies.pdf)
- [Learnsic grading-systems overview](https://learnsic.com/blog/grading-systems-around-the-world)

## Maintenance rules

- Do not add a named evaluator's scale without a public, country-specific primary source that supports the exact mapping.
- Do not infer an ECTS letter grade from a fixed percentage table.
- Keep percentage band checks lower-bound based so decimal values cannot fall between ranges.
- Require the programme pass mark whenever the selected method depends on it.
- Keep source links visible beside the result and review destination guidance at least annually.
