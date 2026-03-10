# LLM Prompts Library

This document contains the formal prompt library for the PGR Supervision Matching System. All prompts are defined in `backend/shared/llm/prompts.py` and used via the `LLMClient` class in `backend/shared/llm/client.py`.

## Overview

The system uses OpenAI's API for:

- **Text Summarization:** Extracting structured information from research proposals
- **Keyword Extraction:** Identifying research topics and methodologies
- **Match Reasoning:** Generating human-readable explanations for supervisor recommendations
- **Justification:** Creating brief explanations for confirmed allocations
- **Risk Analysis:** Identifying potential conflicts or concerns (optional)

All prompts are designed to return structured JSON responses for easy parsing and integration.

---

## PROMPT_SUMMARISE_APPLICATION

### Purpose

Generates a structured summary from raw application text. This is the primary prompt used when processing new PhD/MRes applications.

### Usage

Called automatically when a new application is created via the applicant service.

### Template

```
You are analyzing a PhD/MRes application proposal. Extract and structure the following information:

1. **Research Title**: A clear, concise title for the research
2. **Primary Theme**: The main research area or theme (e.g., "Machine Learning", "Renewable Energy")
3. **Secondary Theme**: A complementary or related theme
4. **Research Summary**: A 2-3 sentence summary of the proposed research
5. **Key Topics**: List 5-10 key research topics or keywords
6. **Research Methods**: List 3-5 research methods or methodologies mentioned
7. **Potential Risks or Challenges**: Any risks, challenges, or limitations mentioned
8. **Quality Assessment**: Rate the overall quality of the application (0-100) based on:
   - Clarity and coherence of writing
   - Research rigor and depth
   - Feasibility of the proposed research
   - Originality and innovation
   - Alignment with academic standards
9. **AI Detection**: Assess the probability (0-100) that this text was AI-generated. Be STRICT and CRITICAL. Look for:
   - Generic, formulaic language patterns
   - Overly perfect grammar with no natural errors
   - Lack of personal voice, anecdotes, or specific experiences
   - Repetitive sentence structures and transitions
   - Absence of nuanced academic critique
   - Unnatural flow between paragraphs
   - Overuse of buzzwords without substance
   - Perfect but generic academic phrasing
   - Missing specific details, dates, names, or concrete examples
   Score HIGH (70-100) if multiple strong AI indicators are present. Score LOW (0-30) only if text shows clear human characteristics.
10. **Quality Rationale**: Provide a CONCISE, CRITICAL explanation (1-2 sentences maximum) covering:
    - Specific AI indicators found (if any) - be precise: name exact patterns, phrases, or structural issues
    - Key quality strengths/weaknesses - be direct and critical
11. **Profile Information** (extract if available in the application):
    - **Email**: Email address if mentioned
    - **Date of Birth**: Date of birth if mentioned (format as YYYY-MM-DD)
    - **Nationality**: Nationality if mentioned
    - **Country of Residence**: Country of residence if mentioned
    - **Phone Number**: Phone number if mentioned
12. **Educational Qualifications** (extract if available):
    - List of degrees/qualifications mentioned, each with:
      - degree_type (e.g., "BSc", "MSc", "PhD", "BA", "MA")
      - subject_area (if mentioned)
      - university (if mentioned)
      - university_country (if mentioned)
      - classification/grade (if mentioned, e.g., "First Class", "3.8 GPA")
      - year_completed (if mentioned)

Format your response as JSON with these keys:
- title
- primary_theme
- secondary_theme
- summary
- topics (array)
- methods (array)
- risks (optional string)
- priority_score (number 0-100)
- ai_detection_probability (number 0-100) - probability text was AI-generated
- quality_rationale (string, 1-2 sentences maximum, be precise and critical)
- profile (object, optional): {
    email (string, optional)
    date_of_birth (string in YYYY-MM-DD format, optional)
    nationality (string, optional)
    country_of_residence (string, optional)
    phone_number (string, optional)
  }
- degrees (array, optional): [
    {
      degree_type (string, required if degree mentioned)
      subject_area (string, optional)
      university (string, optional)
      university_country (string, optional)
      classification (string, optional)
      year_completed (number, optional)
    }
  ]

IMPORTANT: Only include `profile` and `degrees` fields if they are explicitly mentioned in the application text. If not mentioned, omit these fields entirely (do not include empty objects or arrays).

Application text:
{application_text}
```

### Parameters

- `application_text` (str): The raw text content of the research proposal

### Expected Output Format

```json
{
  "title": "Research Title Here",
  "primary_theme": "Main Research Area",
  "secondary_theme": "Related Research Area",
  "summary": "2-3 sentence summary of the research",
  "topics": ["topic1", "topic2", "topic3", ...],
  "methods": ["method1", "method2", "method3", ...],
  "risks": "Optional risks or challenges identified",
  "priority_score": 85,
  "ai_detection_probability": 25,
  "quality_rationale": "Clear, specific research proposal with original methodology. Minimal AI indicators - natural academic voice with concrete examples."
}
```

### Implementation Details

- **Model:** Uses `llm_model` from settings (default: GPT-4)
- **Temperature:** Uses `llm_temperature` from settings (default: 0.0-0.2 for determinism)
- **Response Format:** JSON object (enforced via `response_format`)
- **System Message:** "You are a research proposal analyst. Return only valid JSON."

### Where It's Used

- `backend/shared/llm/client.py` → `LLMClient.summarise_application()`
- Called by applicant service when processing new applications

---

## PROMPT_KEYWORDS

### Purpose

Extracts topic and method keywords from text. Used to identify research domains and methodologies for better matching.

### Usage

Can be used independently or as part of the application processing pipeline.

### Template

```
Extract research keywords from the following text. Return:
1. Topic keywords (5-10): Main research areas, domains, subjects
2. Method keywords (3-5): Research methodologies, approaches, techniques

Format as JSON:
{
  "topic_keywords": ["keyword1", "keyword2", ...],
  "method_keywords": ["method1", "method2", ...]
}

Text:
{text}
```

### Parameters

- `text` (str): The text from which to extract keywords

### Expected Output Format

```json
{
  "topic_keywords": ["machine learning", "natural language processing", "deep learning", ...],
  "method_keywords": ["quantitative analysis", "experimental design", "statistical modeling", ...]
}
```

### Implementation Details

- **Model:** Uses `llm_model` from settings
- **Temperature:** Uses `llm_temperature` from settings
- **Response Format:** JSON object
- **System Message:** "You are a keyword extraction tool. Return only valid JSON."

### Where It's Used

- `backend/shared/llm/client.py` → `LLMClient.extract_keywords()`
- Can be used for both applicant and staff profile processing

---

## PROMPT_MATCH_REASONING

### Purpose

Generates human-readable explanations for supervisor matches. This is the core prompt for the matching service, providing transparent reasoning for why each supervisor is recommended.

### Usage

Called when a PGR Lead requests supervisor recommendations for an applicant via the matching service.

### Template

```
You are helping match a PhD/MRes applicant with potential supervisors.

**Applicant Information:**
- Name: {applicant_name}
- Degree Type: {degree_type}
- Research Summary: {applicant_summary}
- Key Topics: {applicant_topics}
- Methods: {applicant_methods}

**Ranked Supervisor Candidates:**
{supervisor_list}

For each supervisor listed above, provide a brief explanation (2-3 sentences) of why they are a good match, considering:
- Research area alignment
- Methodological fit
- Expertise overlap
- Any potential synergies

IMPORTANT: Return a JSON object with this exact structure:
{
  "explanations": [
    {"staff_id": "staff_id_from_list_above", "explanation": "your explanation here"},
    {"staff_id": "another_staff_id", "explanation": "your explanation here"},
    ...
  ]
}

Use the exact staff_id values from the supervisor list above. Each explanation should be 2-3 sentences explaining the match.
```

### Parameters

- `applicant_name` (str): Full name of the applicant
- `degree_type` (str): "PHD" or "MRES"
- `applicant_summary` (str): The research summary text
- `applicant_topics` (str): Comma-separated list of topic keywords
- `applicant_methods` (str): Comma-separated list of method keywords
- `supervisor_list` (str): Formatted list of supervisor candidates with their details, match scores, and capacity status

### Expected Output Format

```json
{
  "explanations": [
    {
      "staff_id": "uuid-string",
      "explanation": "2-3 sentence explanation of why this supervisor is a good match"
    },
    {
      "staff_id": "another-uuid-string",
      "explanation": "Another explanation..."
    }
  ]
}
```

### Implementation Details

- **Model:** Uses `llm_model` from settings
- **Temperature:** Uses `llm_temperature` from settings
- **Response Format:** JSON object
- **System Message:** "You are a research supervision matching assistant. Return a JSON object with an 'explanations' key containing an array of objects, each with 'staff_id' (as string) and 'explanation' (as string)."
- **Supervisor List Format:** The supervisor list is formatted as:
  ```
  - Full Name (ID: uuid): Score: 0.xxx, Research: interests, Capacity: AVAILABLE/FULL
  ```

### Where It's Used

- `backend/shared/llm/client.py` → `LLMClient.generate_match_reasoning()`
- Called by matching service when generating recommendations
- Used in `backend/services/matching-service/app/routers/matching.py`

### Notes

- The supervisor candidates are pre-ranked by vector similarity search (pgvector)
- The LLM provides human-readable explanations for the technical match scores
- All staff_ids are converted to strings in the response parsing

---

## PROMPT_JUSTIFICATION_ONLY

### Purpose

Generates a brief justification for a confirmed supervisor assignment. Used when a supervisor has been manually assigned or confirmed.

### Usage

prompt for generating justifications when allocations are confirmed.

### Template

```
Provide a brief justification (2-3 sentences) for why {staff_name} is suitable as {role} for this research:

**Research Summary:** {research_summary}
**Staff Expertise:** {staff_expertise}

Return only the justification text, no JSON or formatting.
```

### Parameters

- `staff_name` (str): Full name of the supervisor
- `role` (str): "DOS", "CO_SUPERVISOR", or "ADVISOR"
- `research_summary` (str): Summary of the applicant's research
- `staff_expertise` (str): Description of the supervisor's expertise

### Expected Output Format

Plain text (2-3 sentences), not JSON.

### Implementation Details

- **Model:** Uses `llm_model` from settings
- **Temperature:** Uses `llm_temperature` from settings
- **Response Format:** Plain text (no JSON formatting)

### Where It's Used

- Currently defined but may not be actively used in the current implementation
- Intended for allocation confirmation workflow

---

## PROMPT_CONFLICTS_AND_RISKS

### Purpose

Analyzes potential conflicts of interest, research overlap concerns, and other risks when matching applicants with supervisors.

### Usage

Optional prompt for risk analysis. Can be used before confirming allocations to identify potential issues.

### Template

```
Analyze potential conflicts or risks in matching this applicant with the proposed supervisor:

**Applicant Research:** {applicant_summary}
**Supervisor Profile:** {supervisor_profile}

Identify:
1. Any potential conflicts of interest
2. Research overlap concerns
3. Capacity or workload risks
4. Other relevant risks

Format as JSON:
{
  "conflicts": ["conflict1", "conflict2"],
  "risks": ["risk1", "risk2"],
  "overall_assessment": "LOW|MEDIUM|HIGH"
}
```

### Parameters

- `applicant_summary` (str): Summary of the applicant's research
- `supervisor_profile` (str): Description of the supervisor's profile, expertise, and current situation

### Expected Output Format

```json
{
  "conflicts": ["List of potential conflicts of interest"],
  "risks": ["List of identified risks"],
  "overall_assessment": "LOW|MEDIUM|HIGH"
}
```

### Implementation Details

- **Model:** Uses `llm_model` from settings
- **Temperature:** Uses `llm_temperature` from settings
- **Response Format:** JSON object

### Where It's Used

- Currently defined but may not be actively used in the current implementation
- Intended for pre-allocation risk assessment

---

## Prompt Formatting Function

### `format_prompt(template: str, **kwargs: Any) -> str`

Utility function for formatting prompt templates with provided variables.

**Usage:**

```python
from backend.shared.llm.prompts import PROMPT_SUMMARISE_APPLICATION, format_prompt

prompt_text = format_prompt(
    PROMPT_SUMMARISE_APPLICATION,
    application_text="Raw application text here..."
)
```

---

## LLM Configuration

### Models Used

- **Embedding Model:** `text-embedding-3-small` (1536 dimensions) - configured via `EMBEDDING_MODEL` environment variable
- **Completion Model:** GPT-4 or GPT-4-turbo - configured via `LLM_MODEL` environment variable

### Temperature Settings

- **Default:** 0.0-0.2 (low temperature for deterministic, consistent outputs)
- **Configuration:** Set via `LLM_TEMPERATURE` environment variable

### API Configuration

- **Provider:** OpenAI API
- **API Key:** Required via `OPENAI_API_KEY` environment variable
- **Client:** Initialized in `LLMClient.__init__()` from `backend/shared/llm/client.py`

---

## Best Practices

1. **Consistency:** All prompts use JSON response format for easy parsing
2. **Determinism:** Low temperature settings ensure consistent outputs
3. **Transparency:** Match reasoning prompts provide clear explanations
4. **Error Handling:** All LLM responses are parsed with error handling
5. **Validation:** Response formats are validated before use

---

## Future Enhancements

Potential improvements to the prompt library:

- Fine-tuning prompts based on user feedback
- Adding domain-specific prompts for different research areas
- Implementing prompt versioning for A/B testing
- Adding prompt templates for email notifications
- Creating prompts for automated report generation

---

## Related Documentation

- **Technical Specification:** `docs/spec.md` (Section 8: LLM Integration Strategy)
- **Implementation:** `backend/shared/llm/client.py`
- **Prompt Definitions:** `backend/shared/llm/prompts.py`
- **Matching Service:** `backend/services/matching-service/app/routers/matching.py`

---

# Maintainer

Dr. Mabrouka Abuhmida
Research & Innovation Lead
University of South Wales

**Last Updated:** November 24, 2025
