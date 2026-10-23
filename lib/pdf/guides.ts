export type GuideSection = { title: string; text: string };
export type ToolGuide = {
  intro: string;
  steps: GuideSection[];
  useCases: GuideSection[];
  faqs: GuideSection[];
};

export const guides: Record<string, ToolGuide> = {
  protect: {
    intro:
      "Protect PDF adds AES-256 encryption and an opening password to a document. This can help control access when a file needs to be stored or shared with a specific recipient. Choose a password you can retain securely, because you will need it to open the protected output. Password protection does not inspect the document for private information or remove content. Review the file itself before encrypting it, and verify the downloaded result before distributing the protected copy.",
    steps: [
      {
        title: "Select and review the PDF",
        text: "Add one PDF through the chooser or drop area. Check that it is the version you intend to share and contains only the required pages. If it already has an opening password, provide that current password separately so the tool can read the source.",
      },
      {
        title: "Enter a new opening password",
        text: "Use the New password field and choose between 8 and 64 characters. Store it somewhere you can retrieve later without placing it in the PDF's filename. The new password applies to the downloaded result, while the source file on your device remains unchanged.",
      },
      {
        title: "Encrypt the document",
        text: "Press Protect PDF and wait while the browser creates the encrypted output. Files and passwords are processed on your device. Save the download when it is ready, keeping it distinguishable from any unprotected source copies you still need to retain.",
      },
      {
        title: "Test access before sharing",
        text: "Open the output in a PDF viewer and confirm that it requests the intended password. Test the correct password and check the document contents after opening. Share access details through a suitable separate channel and make sure the intended recipient can use an encrypted PDF.",
      },
    ],
    useCases: [
      {
        title: "Share a private administrative packet",
        text: "A student or employee may need to send a document containing personal records to an authorized reviewer. Password protection can add an access barrier to the file. Confirm the recipient accepts encrypted attachments and use the required submission method when an institution provides its own secure portal.",
      },
      {
        title: "Keep an encrypted working archive",
        text: "A team member can create a protected copy of a document for an archive that other people might access. Maintain a clear record of which copy is encrypted and how authorized users retrieve its password. The tool does not remove unprotected copies already stored elsewhere on the device.",
      },
    ],
    faqs: [
      {
        title: "What kind of protection is applied?",
        text: "The processor writes AES-256 PDF encryption with the supplied opening password. This workflow is about requiring a password to open the resulting document. It is not a full document-rights platform with user accounts, access expiry, audit trails, or remote revocation after a recipient has downloaded it.",
      },
      {
        title: "Can PDFzuno recover a forgotten password?",
        text: "Do not rely on password recovery. The tool does not store your password on a processing server, and Unlock PDF requires successful authentication when a document needs an opening password. Keep an authorized source copy and retain the password through a method appropriate for your records.",
      },
      {
        title: "Does encryption remove sensitive information?",
        text: "No. The document's information remains available to someone who can open it. Remove unnecessary pages or redact specific sensitive content before protecting the file. Also inspect retained pages and other document data separately when preparing a copy for a different audience.",
      },
    ],
  },
  unlock: {
    intro:
      "Unlock PDF removes encryption after the tool successfully opens a document using its current password when one is required. Use it for files you own or are authorized to modify, such as a protected record that needs further editing in your own workflow. It does not guess, crack, or recover unknown passwords. The downloadable result is an unencrypted copy, so think about where it will be saved and who can access that location before you proceed.",
    steps: [
      {
        title: "Choose an authorized PDF",
        text: "Add one protected PDF using the chooser or drag area. Confirm that you have permission to create an unlocked copy. Keep the original encrypted document if it is part of your archive, since the operation creates a new result rather than modifying that source file.",
      },
      {
        title: "Enter the current password",
        text: "Open the Current PDF password setting and type the document's existing password when required. Check capitalization and other characters carefully if authentication fails. The tool must be able to read the document before it can write an unencrypted version.",
      },
      {
        title: "Create the unlocked copy",
        text: "Press Unlock PDF and wait for the download link. Passwords and document contents remain on your device during processing. If the current password is rejected, obtain the correct credentials from the authorized owner rather than expecting this workflow to bypass the opening protection.",
      },
      {
        title: "Verify and store the result",
        text: "Save the output, open it in a viewer, and confirm that it no longer requests the opening password. Check that its pages are complete. Store the unencrypted copy appropriately, and use Protect PDF with a new password if your next sharing step requires encryption again.",
      },
    ],
    useCases: [
      {
        title: "Prepare your document for editing",
        text: "An owner may need to annotate, organize, or combine a document that was previously encrypted for delivery. Creating an authorized unlocked copy can support those later operations. Review the resulting file and reapply protection if the revised version will leave your controlled working environment.",
      },
      {
        title: "Update an archive's access arrangement",
        text: "A team may have a document password that needs to be replaced under its own records process. Unlocking with the existing password, then using Protect PDF with a new one, creates an updated copy. Keep the archive's version labels clear so colleagues use the intended protected version.",
      },
    ],
    faqs: [
      {
        title: "Can I unlock a PDF without knowing its password?",
        text: "If the PDF requires an opening password, you need a valid one for this workflow. The tool authenticates before removing encryption and does not offer password recovery or brute-force attempts. Ask the authorized owner for credentials or an accessible source copy when you cannot open it.",
      },
      {
        title: "Does unlocking change the original on my device?",
        text: "No. You receive a new downloadable PDF, while the selected source remains unchanged. The new copy no longer has the same opening-password protection, so distinguish it clearly from the encrypted version and review how it is stored or shared.",
      },
      {
        title: "Can I add a different password afterward?",
        text: "Yes. Use the unlocked output in Protect PDF and supply a new password. Open that newly protected file to verify the password and contents before distributing it. Remember that creating a protected copy does not automatically remove other unlocked copies from your device.",
      },
    ],
  },
  sign: {
    intro:
      "Sign PDF places a drawn signature or a typed italic name onto a selected page. You can use the page preview to position the visual mark, then download a signed copy for review. This is a visual electronic signature workflow rather than a certificate-based cryptographic signature service. Check the recipient's required signing process before using it, especially when the document needs identity verification, a certificate, an audit trail, or a specific institutional signing system.",
    steps: [
      {
        title: "Choose the document and page",
        text: "Add one PDF and enter its current password if necessary. Set Page number to the page containing the signature area. Review the full document before adding your mark, making sure the version, name, and other details are the ones you intend to sign.",
      },
      {
        title: "Load the preview and select an area",
        text: "Press Load page preview and mark the intended signature rectangle. You can also adjust its position and dimensions in points measured from the top-left corner. There are 72 points in an inch. Keep the box within the page and away from text the signature should not cover.",
      },
      {
        title: "Draw or type your signature",
        text: "Use the signature pad with a pointer or touch input, or leave the drawing empty and enter a typed signature name. The typed name is used as the fallback when no drawing is present. Check the chosen signature and placement before running the operation.",
      },
      {
        title: "Save and inspect the signed copy",
        text: "Press Sign PDF and download the result. Open the selected page and confirm that the entire signature is visible at a suitable size. Check nearby form fields and text for overlap, then save the approved copy with a clear filename for the intended recipient.",
      },
    ],
    useCases: [
      {
        title: "Complete an accepted visual-signature form",
        text: "Some routine administrative workflows accept a visible signature on a PDF. The tool can place your mark without printing and scanning a new copy. Confirm that the recipient accepts this method and that all required names, dates, and other form entries have been completed separately.",
      },
      {
        title: "Add a visual approval to a working copy",
        text: "A team can use a visible signature when its process calls for a marked review copy. Retain the context of who approved the document and which version was reviewed through the team's established workflow. The PDF mark alone does not provide a certificate or independently verified identity.",
      },
    ],
    faqs: [
      {
        title: "Is this a certificate-based digital signature?",
        text: "No. The tool embeds a visual drawing or typed name. It does not provide certificate-backed tamper validation, signer identity verification, or an audit trail. Use the recipient's required signing system when those features are part of the document's acceptance requirements.",
      },
      {
        title: "Can I sign with a phone or tablet?",
        text: "The signature pad supports pointer and touch input in compatible browsers. Use the page preview to check placement carefully on a small screen. Download and reopen the result before sending it so a cramped drawing or an incorrectly sized signature box does not go unnoticed.",
      },
      {
        title: "Can I place a signature on every page at once?",
        text: "The current operation targets one chosen page and one rectangle. For additional signatures, work on the downloaded result and repeat the placement for another page, reviewing each output. Keep the original and ensure the finished file matches the recipient's requested signing process.",
      },
    ],
  },
  redact: {
    intro:
      "Redact PDF permanently removes content inside one selected rectangle on one page and rewrites the document. It is intended for a specific area containing information that should not appear in a shared copy. Unlike placing a dark shape over text or cropping a page, the redaction processor removes affected text, image pixels, and intersecting graphics. Plan the area carefully and inspect the output, because this operation does not automatically find every occurrence of a name or sanitize the entire document.",
    steps: [
      {
        title: "Select the document and target page",
        text: "Add one PDF, provide its current password if required, and set Page number to the page containing the sensitive area. Review surrounding content and other occurrences first. Keep a controlled original copy so you can correct an overly broad selection without losing the source information.",
      },
      {
        title: "Mark the rectangle in the preview",
        text: "Load the page preview and select the area to remove. Adjust the top-left position, width, and height in points if needed. Include the complete sensitive content, including nearby characters or parts of an image, while avoiding useful information that should remain visible.",
      },
      {
        title: "Apply permanent redaction",
        text: "Press Apply permanent redaction only after reviewing the selected area. The processor removes content affected by that rectangle and performs a full rewrite. It targets the chosen page and rectangle; it does not automatically search all pages for matching text or repeat the selection throughout the document.",
      },
      {
        title: "Inspect the shared copy thoroughly",
        text: "Download the output and check the redacted page visually and with text selection or search where applicable. Review other pages, attachments, metadata, and form data separately for related information. If more areas need removal, repeat the operation on the reviewed output and inspect the final result again.",
      },
    ],
    useCases: [
      {
        title: "Share an example without a visible identifier",
        text: "A teacher or administrator may need a sample page without a specific personal identifier. Redacting that area can remove it from the page content. Review the entire file for repeated names, identifiers, and embedded data before treating the resulting document as suitable for its new audience.",
      },
      {
        title: "Prepare a focused external document copy",
        text: "A team may share a document while excluding a particular internal note or image detail. Mark the exact area and verify that the rewrite removes the intended information without damaging nearby content. Use a separate broader review to decide whether the remaining document is appropriate to distribute.",
      },
    ],
    faqs: [
      {
        title: "Why not crop or cover the sensitive text?",
        text: "Cropping changes the visible boundary and covering adds another visual object; neither reliably removes underlying content. Redaction is designed to remove content affected by the selected rectangle. Still inspect the downloaded PDF rather than judging success only from the preview or the presence of a blank area.",
      },
      {
        title: "Does one rectangle remove matching text everywhere?",
        text: "No. The operation affects one rectangle on one chosen page. Other occurrences on the same page or elsewhere must be reviewed separately. Attachments, metadata, and form data also need separate inspection because the tool is not an automatic whole-document sanitization service.",
      },
      {
        title: "Can I undo the downloaded redaction?",
        text: "The redacted output is intended to remove the affected content permanently. Keep your original securely if you may need to revise the selection. Do not distribute that original alongside the redacted copy when it would reveal the information you intended to exclude.",
      },
    ],
  },
  repair: {
    intro:
      "Repair PDF attempts to recover readable document structure and rewrite PDF objects and cross-references into a new file. It can help with some damaged documents that fail to open or behave inconsistently in viewers. Recovery is best effort: missing bytes, severely corrupted images, or content that was never saved cannot always be reconstructed. Keep the damaged original, and judge the repaired copy by its actual page content rather than simply whether the tool produces a download.",
    steps: [
      {
        title: "Keep the original and check the source",
        text: "Save a copy of the damaged PDF before attempting repair. If it came from a download or email, consider obtaining a fresh copy from the authorized sender. An incomplete transfer may be solved more accurately by downloading again than by rebuilding a damaged local file.",
      },
      {
        title: "Add the PDF to the workspace",
        text: "Choose the damaged file and keep it within the 50 MB input limit. If the document is encrypted and the engine can read its protection settings, supply the current password. Repair does not replace the need for valid credentials on a password-protected document.",
      },
      {
        title: "Run the recovery attempt",
        text: "Press Repair PDF and wait while the engine reads recoverable structure and writes a new document. Some files can be reconstructed, while others will return an error or an incomplete result. Keep the page open until processing finishes or cancel if you need to stop the attempt.",
      },
      {
        title: "Compare the result with available references",
        text: "Download the repaired PDF and inspect every important page, image, and table. Check page count, text order, and missing sections against an earlier copy or other source if available. Retain a note that recovery was attempted rather than assuming an opening file is complete and accurate.",
      },
    ],
    useCases: [
      {
        title: "Recover a readable reference copy",
        text: "A damaged study handout or project reference may contain useful pages that an engine can still read. Repair can produce a usable copy when the damage is structural. Compare it with any available original source before relying on quotations, diagrams, or instructions from the recovered document.",
      },
      {
        title: "Troubleshoot inconsistent viewer behavior",
        text: "A PDF might open in one viewer while another reports a structural problem. Rewriting readable objects and cross-references can help in some cases. Test the result in the viewer your recipient actually uses, and ask for a fresh export when important content is missing or still behaves incorrectly.",
      },
    ],
    faqs: [
      {
        title: "Can every corrupted PDF be fixed?",
        text: "No. Recovery depends on which structures and content remain readable. A partially downloaded file, destroyed page data, or severely corrupted objects may not be recoverable. The tool cannot invent missing text or recreate original images from data that is no longer present.",
      },
      {
        title: "Does a successful download prove the file is complete?",
        text: "No. A reconstructed PDF may open while still lacking pages, images, or important details. Review the contents and compare them with a trusted reference where possible. For an important record, obtaining a fresh copy from its source is preferable when there is uncertainty about completeness.",
      },
      {
        title: "Can repair remove a forgotten password?",
        text: "No. Repair addresses recoverable PDF structure rather than bypassing encryption. A document that requires an opening password still needs valid authentication. Use Unlock PDF with the known current password if your authorized goal is to create an unencrypted copy of an otherwise readable file.",
      },
    ],
  },
  "remove-background": {
    intro:
      "Remove background isolates a person, product, or other subject and exports a PNG with a transparent background. The AI model runs locally on your device after its assets download, so the selected picture does not go to an image-processing server. Results vary with the subject and scene. Clear separation between subject and background usually makes review easier, while fine hair, glass, shadows, and busy scenes may produce imperfect edges that need additional attention.",
    steps: [
      {
        title: "Choose a supported image",
        text: "Add one JPG, JPEG, PNG, or WebP image. The image must fit within the 50 MB input limit and contain no more than 25 megapixels. Select a sharp source where the intended subject is visible, and keep the original in case you need to try another approach.",
      },
      {
        title: "Allow the first model download",
        text: "Press Remove background and keep the tab open. First use downloads an AI model of about 40 MB plus runtime assets from IMG.LY. An internet connection is needed for uncached assets, and the first run can take noticeably longer than a simple image conversion.",
      },
      {
        title: "Review the transparent preview",
        text: "When processing finishes, inspect the subject on the checkerboard preview. Look closely at hair, fingers, product corners, transparent surfaces, and holes between parts of the subject. The checkerboard indicates transparency rather than a pattern that is baked into the downloaded image.",
      },
      {
        title: "Download the PNG cutout",
        text: "Save the PNG and test it against the background where you plan to use it. The output keeps the original image dimensions. Preserve PNG when you need transparent areas; converting the cutout to JPG will remove transparency and replace it with an opaque background.",
      },
    ],
    useCases: [
      {
        title: "Prepare a product image for a layout",
        text: "A small business can isolate a product to place it on a consistent catalog card or promotional design. Check that the model retained the complete item and did not remove important details. Transparent packaging, reflective surfaces, and similar colors between product and background deserve especially close inspection.",
      },
      {
        title: "Place a portrait in a presentation",
        text: "A student or team member can remove a portrait's background before placing the subject on a slide or poster. Inspect hair and shoulders at the final display size. Use an image you have permission to work with, and retain the source if the automatic cutout is not suitable.",
      },
    ],
    faqs: [
      {
        title: "Is the image uploaded for AI processing?",
        text: "No. The model and runtime assets download to your browser, and the image is processed locally in the worker. The external asset connection supplies the software rather than receiving your selected photo. First use requires internet access when those assets are not already cached.",
      },
      {
        title: "Why are some edges or objects missing?",
        text: "Automatic segmentation estimates which pixels belong to the subject. Fine hair, low contrast, reflections, transparent materials, or multiple competing subjects can confuse that estimate. Try a clearer source and inspect the output carefully; the current workspace does not provide manual mask painting to correct every edge.",
      },
      {
        title: "What browser and output format do I need?",
        text: "Use a recent browser supporting image decoding and OffscreenCanvas. Large images and the AI model require memory, so a desktop may handle demanding photos better. The output is a PNG with transparency at the original dimensions, rather than a smaller JPEG or a layered editing file.",
      },
    ],
  },
  crop: {
    intro:
      "Crop PDF trims the visible margin around every page by changing the page viewport. This can make a document easier to read when wide blank borders take up unnecessary screen space. The workspace applies the same margin to each edge, measured in PDF points. Cropping changes what viewers display; it does not permanently erase the information outside the visible boundary. Use a redaction workflow when the goal is to remove sensitive content rather than adjust presentation.",
    steps: [
      {
        title: "Inspect the page margins",
        text: "Open the source and check the narrowest margins across the document. Look at headers, footnotes, page numbers, stamps, and pages of different sizes. A margin that is harmless on one page can hide useful content on another, because the crop setting applies throughout the file.",
      },
      {
        title: "Add the PDF",
        text: "Choose one PDF in the input box and supply the current password if required. Keep the original version separately while you work. If the pages contain very different layouts, consider extracting a consistent section before cropping rather than applying one setting to an unsuitable mixed packet.",
      },
      {
        title: "Enter a conservative trim value",
        text: "Use Trim from each edge to specify the margin in points. There are 72 points in one inch, so even a modest number can noticeably change the visible page. Start small and avoid a value that leaves too little usable page area.",
      },
      {
        title: "Download and review every layout",
        text: "Press Crop PDF, save the output, and inspect representative pages in a viewer. Check that no important text or graphics have disappeared from view. If the trim is too strong, return to your original and run the tool again with a smaller margin.",
      },
    ],
    useCases: [
      {
        title: "Improve reading on a small screen",
        text: "A scanned handout with wide empty borders can leave the actual text tiny on a phone. Cropping can use more of the screen for the page content. It does not sharpen a low-resolution scan, so check readability before assuming the result will solve all viewing problems.",
      },
      {
        title: "Focus a document excerpt",
        text: "A report excerpt may look cleaner with less empty space around a central diagram or text block. Use a cautious crop that retains captions and context. If the document will be printed or submitted to a formal template, confirm that changing its visible dimensions is acceptable.",
      },
    ],
    faqs: [
      {
        title: "Does cropping permanently delete hidden content?",
        text: "No. This tool changes the page viewport, and content outside it may remain recoverable inside the PDF. Cropping is not suitable for hiding an account number, personal address, or confidential note. Use Redact PDF for permanent removal in a selected rectangle and inspect the output.",
      },
      {
        title: "Can I set different margins on different edges?",
        text: "The current workspace uses one trim value for every edge and applies it to all pages. It does not offer separate left, right, top, and bottom controls. Use a more detailed page-layout workflow if your document requires an asymmetric crop or different settings for each page.",
      },
      {
        title: "Will a smaller visible page mean a smaller file?",
        text: "Not necessarily. The underlying content can remain stored even when it sits outside the new viewport. Cropping is a presentation change rather than a file-size optimization. Use Compress PDF separately when you need a smaller attachment, and review any compression mode's effect on document features.",
      },
    ],
  },
  "excel-pdf": {
    intro:
      "Excel to PDF converts readable content from a modern XLSX workbook into PDF pages. It is useful when someone needs to read spreadsheet information without opening an editable workbook. The conversion reflows supported worksheet content rather than reproducing Microsoft Excel's exact print engine. Review tables, charts, merged cells, and formula values carefully. A workbook designed around a precise print area or elaborate dashboard may be better served by native export from its spreadsheet application.",
    steps: [
      {
        title: "Prepare an XLSX workbook",
        text: "Choose a modern XLSX file. Legacy XLS files and CSV files are not inputs for this workspace. Open the workbook in a spreadsheet application first to confirm that the sheets and displayed values are current, then keep that original editable workbook as your source.",
      },
      {
        title: "Review the content you expect",
        text: "Identify the important worksheets, headings, totals, and tables before converting. Note features that depend on Excel-specific rendering, such as charts, merged headings, and carefully set print regions. The PDF should be checked against this list rather than judged only by whether it opens.",
      },
      {
        title: "Run Excel to PDF",
        text: "Select the file in the input box, remain within the 50 MB limit, and press Excel to PDF. The browser prepares a readable reflow of supported content. Wait for the download link and save the PDF separately from your original workbook.",
      },
      {
        title: "Compare the PDF with the workbook",
        text: "Check column headings, row groupings, important totals, and any content near page breaks. Verify formula values and sheet coverage against the source. If a table becomes hard to follow or a visual feature is missing, simplify the source or use the spreadsheet application's own PDF export.",
      },
    ],
    useCases: [
      {
        title: "Share a simple inventory list",
        text: "A straightforward stock or equipment table can be easier to distribute as a PDF when readers only need a reference copy. Confirm that item identifiers, quantities, and headings remain associated with the correct rows. Keep the workbook for updates and generate a fresh PDF whenever the underlying list changes.",
      },
      {
        title: "Include a spreadsheet summary in a packet",
        text: "A student or project team can convert a simple worksheet into a document that can be merged with a report. Review its legibility before combining it with the other PDFs. Large, wide tables may need preparation in the source application to make the final pages useful.",
      },
    ],
    faqs: [
      {
        title: "Are formulas recalculated by this converter?",
        text: "Do not rely on this conversion as a replacement for a spreadsheet calculation engine. Verify the workbook's formula values in a spreadsheet application before conversion and compare the output afterward. The PDF is a readable document, not a workbook with live formulas and interactive cells.",
      },
      {
        title: "Will charts and merged cells look identical?",
        text: "Exact Excel layout is not guaranteed. Supported worksheet content is reflowed, and charts, merged cells, styling, and print settings need special review. Use native PDF export when the original presentation of a dashboard, chart, or precisely formatted schedule must be preserved.",
      },
      {
        title: "Can I convert an XLS or CSV file here?",
        text: "This tool accepts XLSX. Open another spreadsheet format in a compatible application and save an XLSX copy first, checking data types and values during that conversion. Renaming the extension alone does not create a valid workbook and will not make the file compatible.",
      },
    ],
  },
  "pdf-excel": {
    intro:
      "PDF to Excel groups selectable PDF text into rows and columns and creates an XLSX workbook with one worksheet per source page. It provides a starting point for reviewing tables that exist only in a finished PDF. A PDF does not normally contain the original spreadsheet structure or formulas, so the converted workbook requires inspection. Column alignment, repeated headings, wrapped cells, and page breaks can all affect how text is arranged in the output.",
    steps: [
      {
        title: "Check that the PDF contains text",
        text: "Try selecting a value in a PDF viewer before conversion. Image-only scans do not contain the text positions this tool needs, and OCR is not included. Choose a PDF with a usable text layer, then provide its current password in the workspace if necessary.",
      },
      {
        title: "Identify the important table structure",
        text: "Note the intended column headings, row labels, totals, and tables that continue onto later pages. This gives you a reference for reviewing the workbook. A page with multiple unrelated text blocks may need more manual cleanup than a simple, evenly spaced table.",
      },
      {
        title: "Create the XLSX workbook",
        text: "Add the PDF and press PDF to Excel. Keep the file within the 50 MB input limit and wait for the download. The conversion makes a separate worksheet for each page rather than automatically joining a table that runs across the entire document.",
      },
      {
        title: "Validate cells before analysis",
        text: "Open the XLSX and compare important rows with the PDF. Check signs, decimal separators, dates, units, and column alignment. Remove repeated page headers or join tables only after confirming their structure. Add formulas yourself where appropriate; the converter cannot recover the original spreadsheet calculations.",
      },
    ],
    useCases: [
      {
        title: "Reuse a published data table",
        text: "A researcher can move selectable values from a PDF appendix into a workbook for further inspection. The export reduces initial transcription work, but every important column still needs checking. Confirm the source definitions and units before using converted values to create a chart or compare groups.",
      },
      {
        title: "Organize a tabular administrative report",
        text: "A team can use the workbook as a starting point for sorting an equipment list, attendance record, or other authorized tabular report. Compare row labels and totals with the PDF before applying filters. Keep the source attached to the workflow so later reviewers can verify ambiguous extracted cells.",
      },
    ],
    faqs: [
      {
        title: "Can I convert a scanned table?",
        text: "A scan needs a text layer before this converter can extract its values. The tool does not perform OCR. Use a separate OCR workflow when appropriate, and verify recognized characters carefully because a mistaken digit or separator can change a table's meaning.",
      },
      {
        title: "Will formulas and original cell formatting return?",
        text: "No. PDF pages do not provide the original workbook's formulas, cell references, or full formatting model. The output is reconstructed from text positions. Treat values as extracted content, check their data types, and build any new calculations explicitly in your spreadsheet application.",
      },
      {
        title: "Why is one table spread across several worksheets?",
        text: "The converter creates one worksheet per PDF page. It does not automatically infer that repeated headers belong to a single continuous table. After verifying columns, you can combine the relevant rows in a spreadsheet editor and remove duplicate headings or page-footer text.",
      },
    ],
  },
  "ppt-pdf": {
    intro:
      "PowerPoint to PDF converts readable content from a PPTX presentation into a PDF that recipients can open without presentation software. The tool uses reflow conversion, so it is best treated as a content-focused export rather than an exact reproduction of slide design. Complex charts, drawings, animations, and precise positioning are not preserved reliably. Keep the original presentation and compare the PDF with it whenever visual relationships or slide arrangement are important to the message.",
    steps: [
      {
        title: "Choose a modern presentation",
        text: "Save your source as PPTX and select it in the input box. Legacy PPT files are not supported here. Open the presentation first to confirm that the intended slides and readable content are present, and keep an editable master copy for any later updates.",
      },
      {
        title: "Check design-dependent slides",
        text: "Identify diagrams, charts, overlapping text, unusual fonts, and other slides whose meaning depends on exact visual placement. Reflow can change their presentation. If the slide design must remain identical, export to PDF from your presentation editor and review that result instead.",
      },
      {
        title: "Create the PDF",
        text: "Keep the input within 50 MB and press PowerPoint to PDF. The browser converts supported slide content into readable document pages. Keep the tab open while processing, then save the downloadable PDF with a filename that distinguishes it from the source presentation.",
      },
      {
        title: "Compare content and reading order",
        text: "Open the PDF and check that key headings, explanations, and supported images are present. Review slides with dense content particularly closely. A PDF is a static document, so confirm that a slide's meaning does not depend on an animation or timed reveal that no longer exists.",
      },
    ],
    useCases: [
      {
        title: "Share a text-focused teaching outline",
        text: "A teacher can create a readable reference from a simple presentation containing headings and explanatory text. Students can open the PDF without editing the slides. Check that examples, labels, and any images needed to understand the lesson survived conversion before distributing the reference copy.",
      },
      {
        title: "Archive a meeting presentation's content",
        text: "A team may want a PDF record of a simple meeting deck alongside its notes. Content-focused conversion can support that archive when exact slide styling is not essential. Keep the original PPTX as well so future readers can recover the intended presentation and any features absent from the PDF.",
      },
    ],
    faqs: [
      {
        title: "Will my slides look exactly like PowerPoint?",
        text: "No. This tool reflows readable PPTX content instead of rendering slides with Microsoft's layout engine. Charts, complex drawings, fonts, and exact slide styling can differ or be missing. Use native PDF export when preserving the deck's design is a requirement.",
      },
      {
        title: "Are animations or embedded videos included?",
        text: "A static PDF cannot reproduce a presentation's timed animation or video playback in this workflow. Check whether each important point is understandable without those features. Add an explanatory still or rewrite the source when the shared document needs to stand on its own.",
      },
      {
        title: "Can I convert an older PPT file?",
        text: "The workspace accepts PPTX. Open a legacy PPT file in compatible presentation software and save a PPTX copy first, then review that saved copy before converting. Changing the filename extension is not a valid substitute for converting the presentation's underlying format.",
      },
    ],
  },
  "pdf-ppt": {
    intro:
      "PDF to PowerPoint makes a PPTX presentation using either full-page images or positioned editable text. Choose page images when you need slides that resemble the PDF, and editable text when you want a starting point for rewriting its selectable content. These modes serve different purposes: preserving the appearance does not recreate individual editable objects, while extracting text does not reconstruct all the original graphics or layout. Review the result before using it in a presentation.",
    steps: [
      {
        title: "Choose the source PDF",
        text: "Add one PDF and enter the current password if required. Consider whether the pages are already shaped like slides or are portrait report pages. A page can be converted into a slide, but its original density may still make it difficult for an audience to read.",
      },
      {
        title: "Select appearance or editable text",
        text: "Preserve appearance creates a slide image for each page and works with scanned pages. Editable text exports positioned text boxes from selectable text, without the original graphics. OCR is not included, so an image-only PDF will not yield recognized words in editable mode.",
      },
      {
        title: "Generate and download the PPTX",
        text: "Press PDF to PowerPoint and wait for the download link. Save the generated PPTX and open it in a compatible presentation editor. Keep the source PDF nearby for comparison, since the most useful next steps depend on your chosen mode and the original document.",
      },
      {
        title: "Prepare the slides for an audience",
        text: "Check slide count, text order, symbols, and visual clarity. In image mode, avoid enlarging small page details beyond useful readability. In editable mode, rebuild missing graphics and simplify dense paragraphs. Test the result at presentation size rather than reviewing only small slide thumbnails.",
      },
    ],
    useCases: [
      {
        title: "Present selected report pages",
        text: "Appearance mode can turn a PDF chart page or report excerpt into a visual reference in a slide deck. Extract only the pages you need first if the source is long. Add your own explanation in the presentation editor so an audience understands what to notice in the page image.",
      },
      {
        title: "Rebuild a presentation from available text",
        text: "When the editable source is missing, text mode can provide a starting point for a new deck from a PDF's selectable text. Review each extracted block and rebuild the hierarchy. Use this as a drafting aid rather than assuming the original slide components have been recovered.",
      },
    ],
    faqs: [
      {
        title: "Can I edit each object in appearance mode?",
        text: "No. Each PDF page is placed on a slide as an image. You can work with that image in your editor, but its text and graphics do not become separate shapes. Select editable text mode when rewriting text is more important than preserving the page's appearance.",
      },
      {
        title: "Does editable mode preserve photographs and charts?",
        text: "Editable text mode focuses on extracting text boxes and does not preserve original graphics. You may need to recreate charts or insert source images separately. Compare the output with the PDF so a missing illustration does not leave a caption or instruction without its context.",
      },
      {
        title: "Can scanned pages become editable slides?",
        text: "Scanned pages work as images in appearance mode. Editable text mode needs selectable PDF text and does not include OCR. If you recognize scan text separately, proofread it before rebuilding a presentation, particularly where numbers, symbols, or labels carry the meaning.",
      },
    ],
  },
  organize: {
    intro:
      "Organize PDF rebuilds a document from the page sequence you enter. You can move pages into a clearer order, keep only a chosen selection, or duplicate a page by repeating its number. This is useful for correcting scanner output or assembling a reading packet after merging files. The page numbers you enter refer to positions in the selected source PDF, not the page labels printed in its headers, footers, or table of contents.",
    steps: [
      {
        title: "Select the source document",
        text: "Add one PDF and provide the current password if required. Review the source in a viewer and write down its physical page positions. Include cover pages and inserts in your count so your new sequence refers to the actual pages stored in the file.",
      },
      {
        title: "Enter the complete new order",
        text: "Use New page order to enter a sequence such as 3, 1, 2. Ranges can help describe consecutive sections. Include every page you want in the result, because the selection defines the new document rather than simply moving one page while automatically retaining all others.",
      },
      {
        title: "Check duplicates and omissions",
        text: "Repeated numbers intentionally duplicate pages. For example, 1, 2, 2, 3 includes the second source page twice. Check your list for accidental repetition and omitted pages before running the tool, especially when several sections look similar or contain nearly identical forms.",
      },
      {
        title: "Download the reorganized PDF",
        text: "Press Organize PDF and save the result. Open it and compare the page count and reading sequence with your planned list. If the document has a printed contents page or page numbers, remember that rearranging pages does not automatically rewrite those references.",
      },
    ],
    useCases: [
      {
        title: "Fix a scan captured out of order",
        text: "A scanner may capture the front pages first and the backs afterward, or a photographed packet may have an incorrect sequence. Page organization lets you rebuild the reading order without re-scanning every page. Verify both sides of each record are placed where the recipient expects them.",
      },
      {
        title: "Build a reusable exercise packet",
        text: "A teacher can repeat a blank response sheet between several exercises or place an instruction page before its worksheet. Work from material you are authorized to reuse. Check that the reconstructed packet still includes answer spaces, diagrams, and instructions needed for each exercise.",
      },
    ],
    faqs: [
      {
        title: "Will pages omitted from the order still appear?",
        text: "No. The entered sequence determines which source pages appear in the output. If you want all pages, include all their positions in the desired order. Keep the original file until you have checked the result so you can recover an accidentally omitted section.",
      },
      {
        title: "Can I organize pages from multiple PDFs?",
        text: "This workspace accepts one PDF. Use Merge PDF to combine the source documents first, then organize the merged result. The page positions you enter must match that merged file, so count through the complete combined document rather than restarting at each source file.",
      },
      {
        title: "Are printed page numbers updated automatically?",
        text: "No. Existing printed numbers are content on the original pages, and rearranging those pages does not rewrite the numbers. Use Page numbers to add a new sequential reference if helpful, choosing a workflow that keeps the final document understandable and avoids confusing duplicate numbering.",
      },
    ],
  },
  watermark: {
    intro:
      "Watermark PDF adds a translucent text watermark to every page. It can help readers identify a working draft, an internal review copy, or the intended context of a shared document. The watermark is a visible label, so it should be brief and easy to recognize without overwhelming the page. It does not encrypt the PDF, establish ownership, or permanently remove content underneath the watermark. Keep a clean original if you may need an unmarked version later.",
    steps: [
      {
        title: "Choose a PDF to label",
        text: "Add one PDF through the file chooser or drop area. Provide the current password when necessary. Review several pages first, especially dense tables, scanned forms, and illustrations, so you can judge whether a repeated watermark will interfere with important details.",
      },
      {
        title: "Write a short watermark message",
        text: "Enter text such as Draft or Internal review in the watermark field. Choose wording that accurately describes the document's status. Basic PDF text drawing uses standard fonts, so keep the label simple and inspect any special characters in the output.",
      },
      {
        title: "Apply the watermark",
        text: "Press Watermark PDF and wait while the browser writes the label across the pages. This operation applies to every page rather than a selected range. The source on your device remains unchanged, and you receive a separate downloadable PDF with the added marking.",
      },
      {
        title: "Check readability throughout",
        text: "Download the watermarked file and examine both sparse and crowded pages. Confirm that the message is readable and that it does not make diagrams, signatures, or small text difficult to interpret. Retain the original and label the marked copy clearly before sharing it.",
      },
    ],
    useCases: [
      {
        title: "Distinguish a proposal draft",
        text: "A team can mark a proposal as Draft while reviewers are still discussing its content. This helps avoid confusion between a review copy and an approved version. Use a consistent filename and version reference alongside the watermark, since the visual label does not automatically track future revisions.",
      },
      {
        title: "Identify an internal training copy",
        text: "A visible internal-use label can give readers context when they open a training packet or reference document. It can also help distinguish example paperwork from a completed form. Check every page for readability and use separate access controls when the file contains private information.",
      },
    ],
    faqs: [
      {
        title: "Does a watermark prevent copying or editing?",
        text: "No. It is a visible text treatment rather than an access restriction. If you need a password to open the document, use Protect PDF separately. A watermark should not be relied on to stop another person from copying, photographing, or modifying information they can view.",
      },
      {
        title: "Can I watermark only one page?",
        text: "The current workspace places the text on every page. For a selected-page workflow, extract those pages first, add the watermark, and rebuild the packet with merge and organization tools. Verify the reconstructed page count and sequence before replacing your working copy.",
      },
      {
        title: "Can a watermark hide confidential information?",
        text: "No. The text underneath remains part of the PDF, and a translucent label is not a redaction. Use Redact PDF to remove content in a specific rectangle, then review other pages, metadata, and attachments separately if the document contains sensitive information.",
      },
    ],
  },
  numbers: {
    intro:
      "Page numbers adds sequential numbering to a PDF so readers have a shared reference when discussing or reviewing it. It is especially helpful after several files have been merged into a single packet, or when scanned pages have no printed numbers. The numbering follows the order of pages in the selected PDF. Finish rearranging, inserting, and removing pages first, because adding numbers before those changes can leave a confusing sequence in the final document.",
    steps: [
      {
        title: "Prepare the final page sequence",
        text: "Open the source PDF and confirm that its pages are in the order you intend to share. Use Merge PDF or Organize PDF first if necessary. Numbering is most useful after the complete packet has been assembled and unnecessary pages have been removed.",
      },
      {
        title: "Select the PDF",
        text: "Choose one PDF in the input box. If the document is encrypted, enter the current password using the workspace setting. Keep the file within the 50 MB input limit and check whether existing printed page numbers might conflict with the new sequence.",
      },
      {
        title: "Create the numbered copy",
        text: "Press Page numbers and wait for processing to finish. The workspace adds sequential numbers to the document; it is not a full publishing interface for custom chapter prefixes or complex numbering schemes. Download the result as a separate file when the link appears.",
      },
      {
        title: "Inspect numbers and page content",
        text: "Open the downloaded PDF and check the first, middle, and last pages. Confirm that numbers are visible, follow the intended order, and do not interfere with existing footer content. Keep the unnumbered original so you can rebuild the packet cleanly after later changes.",
      },
    ],
    useCases: [
      {
        title: "Reference pages during a group review",
        text: "A numbered project packet lets colleagues point to the same page when discussing a diagram, requirement, or proposed edit. This is particularly useful when the packet combines sources with different original numbering. Tell reviewers which sequence to use if some pages already contain printed numbers.",
      },
      {
        title: "Organize a scanned study packet",
        text: "Students can add a continuous reference to scanned notes or a collection of handouts. Numbering makes it easier to return to a particular exercise and spot a missing sheet in a printed copy. Check that the full set is assembled before creating the numbered version.",
      },
    ],
    faqs: [
      {
        title: "Will existing page numbers disappear?",
        text: "No. Existing numbers are part of the original content, and the tool adds a new sequence rather than detecting and replacing them. Review for duplicates or overlapping references. If the old numbering is confusing, keep a clear convention when describing pages to other readers.",
      },
      {
        title: "Can I skip the cover or use Roman numerals?",
        text: "This workspace provides automatic sequential numbering rather than advanced publishing controls. It does not expose a cover-page exception, custom starting value, or Roman numeral scheme. Use a layout application when a submission or publication requires a specific multi-section numbering format.",
      },
      {
        title: "Should I number pages before merging?",
        text: "Usually assemble the complete document first, then add numbers to the finished sequence. Numbering separate source files can produce repeated numbers after merging. If you reorganize a numbered document later, return to an unnumbered source to avoid stacking another numbering layer on top.",
      },
    ],
  },
  remove: {
    intro:
      "Remove pages creates a new PDF that keeps everything except the page positions you specify. It is useful for discarding blank scans, duplicate sheets, or an outdated appendix before sharing a document. Unlike Extract pages, which asks what to keep, this tool asks what to leave out. You must retain at least one page. Review the source carefully before entering a range, especially when printed page numbers differ from the actual positions inside the file.",
    steps: [
      {
        title: "Choose and review the PDF",
        text: "Add one PDF and enter its current password if needed. Open the original in a viewer to identify pages that should be removed. Count the first physical page as one, including covers and introductory material, rather than relying only on numbers printed in the footer.",
      },
      {
        title: "Enter the unwanted page positions",
        text: "In Pages to remove, type numbers and ranges such as 2, 5-7. Check that these are the pages to discard rather than the pages you want to retain. A short written list can help avoid reversing the selection when working through a long packet.",
      },
      {
        title: "Keep at least one page",
        text: "Make sure the selection does not remove the whole document. If you only need one chapter from a very long PDF, Extract pages may be simpler because you can list what to keep. Correct invalid or out-of-range selections before attempting another processing run.",
      },
      {
        title: "Download the cleaned document",
        text: "Press Remove pages and open the downloaded PDF. Check the new page count and the joins around each removed section. Look for broken reading sequences or references to missing attachments, then retain the original until the cleaned copy has been accepted for its intended use.",
      },
    ],
    useCases: [
      {
        title: "Clean up scanner output",
        text: "A scanner can introduce blank reverse sides, repeated pages, or a test sheet at the beginning of a packet. Removing those pages makes the document easier to read and can reduce unnecessary bulk. Inspect apparently blank pages first so faint handwriting or a lightly scanned stamp is not overlooked.",
      },
      {
        title: "Prepare a focused submission",
        text: "An application packet may contain an older cover letter or an appendix that the receiving portal does not request. Remove only the unnecessary pages and check the submission instructions before sending. Keep your complete archive separately in case the recipient later asks for the missing supporting material.",
      },
    ],
    faqs: [
      {
        title: "Does removing a page erase the original file?",
        text: "No. The operation creates a separate downloadable PDF and does not overwrite the source stored on your device. Keep that source as your complete record. Use a distinct filename for the reduced version so you do not confuse the two when uploading or sharing.",
      },
      {
        title: "Can I remove all pages?",
        text: "No. A useful output needs at least one retained page, and the processing path rejects a selection that removes everything. If your goal is a particular excerpt, use Extract pages or Split PDF and specify the pages you actually want in the new document.",
      },
      {
        title: "Is page removal enough to sanitize private information?",
        text: "Removing whole pages excludes those pages from the result, but it does not inspect retained pages, metadata, attachments, or other document data for related information. For a sensitive area on a retained page, use Redact PDF and perform a broader review before distributing the document.",
      },
    ],
  },
  extract: {
    intro:
      "Extract pages saves selected page positions from a PDF as one new document. You can keep a chapter, a certificate, or an appendix without sending the complete source file. This is often simpler than listing every page to remove from a long report. Plan the selection using the page positions in your PDF viewer, including the cover and introductory pages. Printed page labels can use a different sequence and may point you to the wrong physical pages.",
    steps: [
      {
        title: "Select the full source PDF",
        text: "Add the document through the chooser or drop area and provide its current password if required. Open the source in a viewer to identify your excerpt. Make sure the selected portion includes enough surrounding information for another reader to understand it independently.",
      },
      {
        title: "List the pages to keep",
        text: "Enter page numbers and ranges, for example 4-8, 12. These positions describe the pages that will appear in the extracted file. Check both ends of each range so you do not omit a chapter's final paragraph, a diagram legend, or a supporting reference page.",
      },
      {
        title: "Create the excerpt",
        text: "Press Extract pages and wait for the browser to prepare a new PDF. The tool keeps the selected content together in one output document. If you need a separate PDF for each selected page, use the individual ZIP output in Split PDF instead.",
      },
      {
        title: "Review and name the result",
        text: "Download the extracted PDF and compare its page count and content with your selection. Give it a filename that identifies the excerpt rather than the whole source. Keep the complete PDF available in case a reader needs additional context or you need a different selection later.",
      },
    ],
    useCases: [
      {
        title: "Send only the requested certificate",
        text: "A university or employer may request one certificate from a larger scanned packet. Extracting its pages lets you provide the relevant document without unrelated records. Check whether the certificate has a reverse side, translation, or supporting stamp that needs to be included in the submitted file.",
      },
      {
        title: "Share an appendix with a colleague",
        text: "A project reviewer may need a technical appendix but not the entire report. Extract the relevant section and include any definitions or reference pages it depends on. Check that the resulting excerpt is suitable to share and that it does not accidentally include adjacent private content.",
      },
    ],
    faqs: [
      {
        title: "How is extraction different from removing pages?",
        text: "Extraction asks you to list what to keep, while Remove pages asks you to list what to discard. Both create a new document. Choose the approach that makes your selection easier to check, especially when the required excerpt is much shorter than its source.",
      },
      {
        title: "Can I save every selected page separately?",
        text: "This tool combines selected pages into one PDF. For one PDF per selected page, open Split PDF and choose its separate-page ZIP mode. Extract the ZIP before attaching individual PDFs to a form that expects documents rather than an archive.",
      },
      {
        title: "Will printed page numbers restart at one?",
        text: "No. Any printed numbers remain part of the page content. A chapter extracted from the middle of a report can still display its original numbering. If helpful, add a new sequential reference afterward, taking care not to create overlapping or confusing page labels.",
      },
    ],
  },
  "jpg-pdf": {
    intro:
      "JPG to PDF combines JPG and PNG pictures into a single PDF, with one image on each page. It is a practical way to package photographed paperwork, scanned notes, or a sequence of illustrations. The tool uses your chosen file order, so you control the reading sequence before conversion. Image quality still depends on the originals: putting a blurred photo into a PDF does not make its small text sharper or correct a poorly framed scan.",
    steps: [
      {
        title: "Select JPG or PNG images",
        text: "Choose your pictures or drag them into the input box. You can add more images after the first selection. Check that each image contains the intended page and that photographed documents have readable text, useful lighting, and no accidental missing edges.",
      },
      {
        title: "Arrange your PDF pages",
        text: "Use the arrows beside each filename to move pictures up or down. The first image becomes the first PDF page, followed by the rest in list order. Remove duplicate shots, rejected drafts, or unrelated photos before you create the final document.",
      },
      {
        title: "Convert the selected sequence",
        text: "Keep the combined source images within the 50 MB limit and press JPG to PDF. The browser creates a PDF page for each selected image. Keep the tab open until the download link appears; the original pictures are not modified by the operation.",
      },
      {
        title: "Review the complete packet",
        text: "Download the PDF, open it, and inspect every page's orientation, order, and readability. If the file is larger than a submission system permits, try Compress PDF afterward. Keep the original photos until the recipient has accepted the document and you no longer need to rebuild it.",
      },
    ],
    useCases: [
      {
        title: "Submit photographed school paperwork",
        text: "Students can combine clear photos of certificates or handwritten assignment pages into the single PDF requested by a university portal. Include all required pages in the correct order. Inspect small marks and handwriting at normal reading size rather than assuming a phone photo will always be legible.",
      },
      {
        title: "Collect receipts for an expense report",
        text: "Separate receipt pictures can become one organized attachment for a reimbursement request. Put the images in the same order as the related expense list so the reviewer can match each item. Check dates and totals in the PDF, and retain the original images for your records.",
      },
    ],
    faqs: [
      {
        title: "Does JPG to PDF also accept PNG?",
        text: "Yes. You can combine JPG, JPEG, and PNG files in one selection. Other image formats need conversion first. A filename ending in a supported extension must still contain a valid image; changing the extension alone does not make an incompatible file usable.",
      },
      {
        title: "Will text in my images become searchable?",
        text: "No. Each picture becomes a page image inside the PDF. The tool does not include OCR, so photographed or scanned text does not become a selectable text layer. Keep that limitation in mind if a recipient requests an accessible or searchable document.",
      },
      {
        title: "Can I mix these pictures with existing PDF pages?",
        text: "Convert the images here first, then use Merge PDF to combine the result with your existing PDFs. Use Organize PDF afterward if image pages need to sit between particular pages of another document. Verify the final sequence before distributing the complete packet.",
      },
    ],
  },
  "webp-jpg": {
    intro:
      "WebP to JPG converts one WebP image into a widely supported JPEG at the original pixel dimensions. It can help when an application, upload form, or document workflow does not accept WebP. Choose between balanced and high quality depending on the detail you need and the resulting file size. JPEG does not support transparency, so transparent areas become white. An animated WebP becomes a still image rather than an animated JPG.",
    steps: [
      {
        title: "Choose a valid WebP image",
        text: "Add one file with the WebP extension using the chooser or drop area. The tool handles one image per operation. Check that the input is the actual picture you need, rather than a webpage download or another format with a changed filename.",
      },
      {
        title: "Select your JPG quality",
        text: "Use Balanced for a smaller output or High when preserving fine visual detail matters more. Neither mode enlarges the image dimensions or recovers detail already lost in the source. Very detailed pictures can produce a larger JPEG than their WebP original.",
      },
      {
        title: "Run the browser conversion",
        text: "Press WebP to JPG and wait for the preview and download link. Images must fit within the 50 MB input limit and the 25 megapixel image limit. Use a recent browser with the required image decoding and canvas features if processing reports an error.",
      },
      {
        title: "Check the JPEG before using it",
        text: "Inspect the preview, download the JPG, and open it in the destination application. Pay attention to formerly transparent areas, fine edges, and text embedded in the image. Keep the original WebP if you may later need its transparency or animation.",
      },
    ],
    useCases: [
      {
        title: "Attach an image to a restricted form",
        text: "Some submission forms list JPG among their accepted formats while rejecting WebP. Converting gives you a compatible file without changing its pixel dimensions. Check the form's separate requirements for file size and dimensions, because choosing JPEG does not automatically satisfy every upload rule.",
      },
      {
        title: "Use a downloaded graphic in older software",
        text: "A presentation editor or desktop application may handle JPEG more consistently than WebP. Conversion can make an authorized image easier to reuse in a report or slide. Check the white background if the original relied on transparency to blend with a colored page.",
      },
    ],
    faqs: [
      {
        title: "Why did the transparent background turn white?",
        text: "JPEG stores color pixels without an alpha channel. The converter fills transparent areas with white so the JPG has a defined background. Keep a PNG or the original WebP when you need transparency, such as placing a cutout on a colored product card.",
      },
      {
        title: "Can I convert animated WebP files?",
        text: "The output is a still JPEG, so an animation's movement and multiple frames are not preserved. Use a format and workflow designed for animation when you need to retain motion. Review the generated preview to ensure the still frame is suitable for your purpose.",
      },
      {
        title: "Will JPG always be smaller than WebP?",
        text: "No. File size depends on the source image and selected quality, and WebP can already be very compact. Balanced may reduce the JPEG size compared with High, but compare the downloaded output itself when you are working against an attachment or upload limit.",
      },
    ],
  },
  "pdf-jpg": {
    intro:
      "PDF to JPG renders PDF pages as JPEG images and packages them in a ZIP download. You can export the whole document or select particular page positions. This helps when you need a visual page preview for a presentation, a message, or a system that accepts images. The result is a picture of each page, so searchable text, working links, and interactive form fields do not carry over as interactive image features.",
    steps: [
      {
        title: "Add the source PDF",
        text: "Choose one PDF within the 50 MB input limit. If it requires an opening password, enter the current password in the workspace. Think about whether you really need the entire document, since rendering many detailed pages takes more time and browser memory.",
      },
      {
        title: "Choose all pages or a range",
        text: "Leave Page selection blank to render every page. For a smaller export, enter page positions such as 1-3, 5. Count the cover as page one even when printed page numbering begins later; this avoids exporting an adjacent page by mistake.",
      },
      {
        title: "Select the image resolution",
        text: "Choose Standard for 108 DPI output or High for rendering up to 216 DPI. Higher resolution can make text and diagrams clearer, while producing larger images and requiring more memory. The setting cannot recover detail that was missing from a low-quality scan.",
      },
      {
        title: "Download and unpack the ZIP",
        text: "Run PDF to JPG and save the ZIP file. Extract it with your operating system or an archive application, then check the page images. Review text at the size you plan to display it and confirm that the expected number of pages was exported.",
      },
    ],
    useCases: [
      {
        title: "Place a document page in a presentation",
        text: "A page image can show a report excerpt or a sample form inside a slide without depending on an embedded PDF viewer. Export only the relevant page and use an appropriate resolution. Avoid making the image so small that an audience cannot read its labels.",
      },
      {
        title: "Share a visual reference",
        text: "When a recipient needs to see a layout rather than edit its contents, JPEG pages can be convenient visual references. Select the specific pages they need instead of exporting a long document. Check the images before sending them, particularly if nearby pages contain unrelated private information.",
      },
    ],
    faqs: [
      {
        title: "Does this extract the original embedded photographs?",
        text: "No. The tool renders each selected PDF page as a complete image, including text and graphics visible on that page. It does not separately retrieve the original photo files or their original camera metadata from the PDF's internal image objects.",
      },
      {
        title: "Why do I receive a ZIP instead of one JPG?",
        text: "Each selected page needs its own image file. A ZIP groups those JPEGs into one download and keeps a multi-page export together. Extract the archive first if an upload form expects a JPG file rather than an archive containing several images.",
      },
      {
        title: "Can I edit the exported text in Word?",
        text: "A JPEG contains pixels, not editable paragraphs. Use PDF to Word in editable mode when the source has selectable text. Scanned pages require a separate OCR workflow if you need recognized words; exporting them as JPG does not add a text layer.",
      },
    ],
  },
  edit: {
    intro:
      "Edit PDF adds new text to every page of a document at a position you specify. It is useful for a short repeated note, label, or reference, especially when you no longer have the source document. This workspace does not rewrite existing PDF paragraphs or provide a full page-layout editor. Decide what text to add and where it will fit without covering existing content, then inspect the downloaded pages before distributing the edited copy.",
    steps: [
      {
        title: "Choose the PDF you want to annotate",
        text: "Add one PDF and enter its current password if the document is protected. Inspect the page layouts first. Because the same text is added to every page, a clear area on the first page may still overlap a chart or footer elsewhere.",
      },
      {
        title: "Enter the text to add",
        text: "Type a short note into Text to add on every page. Basic insertion uses Latin standard fonts, so check supported characters before relying on the output for another script. Longer text is harder to place neatly and may run beyond the available page space.",
      },
      {
        title: "Set position and font size",
        text: "Enter X and Y coordinates in points measured from the bottom-left corner, then choose the font size. There are 72 points in an inch. Use conservative placement that leaves room around existing text, especially if the document has pages of different dimensions.",
      },
      {
        title: "Create and inspect the edited copy",
        text: "Press Edit PDF and download the result. Check multiple pages, including any landscape pages, to confirm that the note is visible and does not obscure information. If placement needs adjustment, return to the original and rerun with revised coordinates or a smaller font size.",
      },
    ],
    useCases: [
      {
        title: "Add a repeated internal reference",
        text: "A team can place a short project code on each page of a working document to help identify printed copies. Keep the note away from existing headings and footers. For sequential numbering rather than identical text, use Page numbers so every page receives its own number.",
      },
      {
        title: "Label a review packet",
        text: "A repeated review label can help readers recognize the purpose of a draft packet. Use Watermark PDF instead if you want a translucent watermark treatment. Neither label replaces access controls, and neither should be used as a way to hide sensitive information already present in the document.",
      },
    ],
    faqs: [
      {
        title: "Can I replace an existing sentence?",
        text: "This tool inserts additional text; it does not select and replace the original PDF text. For substantial rewriting, convert selectable text with PDF to Word and rebuild the layout as needed. Covering an old sentence with new content is not a reliable way to remove it.",
      },
      {
        title: "Can I place text on only one page?",
        text: "The current text insertion applies to every page. For a one-page change, extract the relevant page first, edit that copy, and then rebuild the document with the organization tools. Check the resulting sequence carefully so the edited page replaces the intended original page.",
      },
      {
        title: "Can I use text insertion for redaction?",
        text: "No. Adding text over private content does not permanently remove the underlying information. Use Redact PDF for a selected sensitive area and inspect the output separately. Cropping and watermarking also serve different purposes and should not be treated as substitutes for redaction.",
      },
    ],
  },
  rotate: {
    intro:
      "Rotate PDF changes the orientation of every page by the clockwise angle you choose. It can correct an upside-down scan or a document whose pages all face sideways. The workspace applies one rotation setting to the complete file, so inspect the page orientations before you begin. A document containing both upright and sideways pages may need a more selective workflow using extraction, rotation, and page organization to put the corrected pages back into place.",
    steps: [
      {
        title: "Choose your PDF",
        text: "Select a PDF using the input box or drag area. Open the source in a viewer and check the direction of several pages rather than only its thumbnail. Supply the current password in the workspace if the document requires one before it can be processed.",
      },
      {
        title: "Pick the clockwise rotation",
        text: "Choose 90 degrees, 180 degrees, or 270 degrees. A 180-degree turn corrects upside-down pages. The 90-degree and 270-degree choices turn sideways pages in opposite directions; use the orientation of the existing text to decide which rotation will make it readable.",
      },
      {
        title: "Apply the same angle to all pages",
        text: "Press Rotate PDF to create a new document. Remember that this setting affects every page, including covers and pages that were already upright. Keep the tab open while processing and wait until the result is ready to download.",
      },
      {
        title: "Verify the reading direction",
        text: "Save the output and open it in a PDF viewer. Inspect the beginning, middle, and end of the document to confirm consistent orientation. Keep the source until you are satisfied, particularly when a scan contains an unexpected mixture of portrait and landscape pages.",
      },
    ],
    useCases: [
      {
        title: "Correct a sideways scanned assignment",
        text: "Students sometimes scan an entire set of pages in the wrong orientation. Rotating the PDF can make that assignment easier to read before it goes to a university portal. Check handwriting and page order afterward, because a rotation corrects direction without fixing a missing or out-of-sequence page.",
      },
      {
        title: "Prepare documents for a shared archive",
        text: "An office can correct a consistently upside-down packet before filing it with other records. This saves readers from manually rotating the view each time they open the file. Use a descriptive output filename so colleagues can distinguish the corrected copy from the original scan.",
      },
    ],
    faqs: [
      {
        title: "Does rotation make a new scan of each page?",
        text: "Rotation changes page orientation rather than applying image-based compression. It is intended to turn the pages, not improve scan resolution or remove blurry text. If readability problems remain after rotating, you may need a better scan of the original paper document.",
      },
      {
        title: "Can I rotate just the sideways pages?",
        text: "This workspace rotates all pages together. You can extract the pages requiring correction, rotate them, and use the merge and organize tools to reconstruct the desired sequence. Review the final page count and order so the workaround does not accidentally omit or duplicate a page.",
      },
      {
        title: "Will rotation reduce the PDF size?",
        text: "Changing orientation is not a compression feature, and the output size may differ only slightly. If your corrected PDF is still too large for sharing, use Compress PDF afterward. Choose lossless compression first when you want to preserve searchable text and other document features.",
      },
    ],
  },
  merge: {
    intro:
      "Merge PDF brings separate documents into one PDF in the order you choose. Instead of sending several attachments, you can prepare a single application, reading packet, or project handover. Each source keeps its pages, while the combined file becomes easier to download and share. Start with the final versions of your documents and decide which file belongs first; merging does not automatically sort documents by their contents or remove repeated pages.",
    steps: [
      {
        title: "Select at least two PDFs",
        text: "Use the file chooser or drag your PDFs into the input box. You can add more files to the selection afterward. Check the filenames carefully, particularly when your folder contains both drafts and approved copies of the same document.",
      },
      {
        title: "Arrange the document sequence",
        text: "Use the up and down arrows beside each selected file. The first file supplies the opening pages, followed by the remaining files in list order. Remove an accidental selection before starting; the arrows move whole files rather than individual pages.",
      },
      {
        title: "Check access and the combined size",
        text: "Keep the total selection within 50 MB. If the documents need a password, use the current password setting. Files with different passwords may need to be unlocked separately with your authorized credentials before you combine them into one operation.",
      },
      {
        title: "Merge and review your download",
        text: "Press Merge PDF and wait for the download link. Open the result and inspect the boundaries between documents, the total page count, and the first and last pages. Keep your original files so you can rebuild the packet if its requirements change.",
      },
    ],
    useCases: [
      {
        title: "Build a university application packet",
        text: "Students can combine a cover sheet, transcript, certificates, and supporting letters when a university portal requests one PDF. Follow the portal's stated document order and check its separate size requirement. If the merged output is too large, use Compress PDF and review small text afterward.",
      },
      {
        title: "Prepare a complete project handover",
        text: "A team can collect a proposal, specification, approval letter, and delivery notes into one handover file. This gives the recipient a clear reading sequence. Use Organize PDF afterward if you need to move a particular page rather than an entire source document.",
      },
    ],
    faqs: [
      {
        title: "Can I merge images or Word files directly?",
        text: "This tool accepts PDF files. Convert photos with JPG to PDF or a modern Word document with Word to PDF first, then merge those outputs. Review converted layouts before combining them, because Office conversion may reflow the original content.",
      },
      {
        title: "Does merging make the document smaller?",
        text: "Merging is an organization task, not a compression setting. The combined document may remain similar in size to its sources. Use the dedicated compression tool when your goal is a smaller attachment, and compare the downloaded size with your destination's limit.",
      },
      {
        title: "Can I change the page order after merging?",
        text: "Yes. Open the merged result in Organize PDF and enter the desired page sequence. You can also remove or extract pages with the dedicated tools. Always use the page positions in the merged file rather than the numbering printed inside each original document.",
      },
    ],
  },
  split: {
    intro:
      "Split PDF lets you take selected pages from a longer document and choose how they are delivered. Save the selection as one smaller PDF, or download a ZIP containing a separate PDF for every selected page. This is useful when recipients need only part of a document. Before selecting a range, distinguish the page positions in the file from printed chapter numbers, cover sheets, and Roman numeral introductions.",
    steps: [
      {
        title: "Choose the source PDF",
        text: "Add one PDF using the input box. Open your original in a viewer if you need to identify its page positions. For an encrypted document, enter its current password in the password setting before processing the selected pages.",
      },
      {
        title: "Enter the pages you need",
        text: "Use single page numbers and ranges, such as 1-3, 5. Count from the first physical page in the file, including covers. Make sure the selection refers to pages that exist; invalid ranges need correcting before a useful result can be produced.",
      },
      {
        title: "Select the output mode",
        text: "Choose Selected pages in one PDF for a continuous excerpt. Choose Separate PDF per selected page when you need individual files packaged in a ZIP. The separate mode makes one file per page, rather than one file for each range you entered.",
      },
      {
        title: "Download and inspect the selection",
        text: "Run Split PDF, save the result, and open the PDF or unpack the ZIP. Check the first and last selected pages and confirm no required page is missing. Rename the output clearly so the excerpt is easy to distinguish from the complete source.",
      },
    ],
    useCases: [
      {
        title: "Share a specific teaching chapter",
        text: "A lecturer can select the pages needed for a lesson from a longer document they are authorized to share. Students receive a focused reading instead of an entire packet. Check that the selection includes any diagrams, references, or instructions needed to understand the excerpt.",
      },
      {
        title: "Separate individual records",
        text: "If a PDF contains one record per page, the individual output mode creates files that can be filed separately. This can help organize receipts or scanned certificates. Inspect the results before distribution, especially when neighboring pages contain information intended for different recipients.",
      },
    ],
    faqs: [
      {
        title: "How is splitting different from extracting pages?",
        text: "Both tools can save a selected subset as a PDF. Split PDF also provides a ZIP mode with a separate PDF for each selected page. Extract pages is a direct choice when you want just one new document containing the selected pages.",
      },
      {
        title: "Will splitting reduce the file size?",
        text: "Keeping fewer pages often produces a smaller document, but size depends on the resources those pages use. A single detailed scanned page can remain large. Compress the excerpt separately if an email service or submission portal imposes a smaller limit.",
      },
      {
        title: "Does the original lose its pages?",
        text: "No. The tool creates a downloadable result and leaves your source file unchanged. Keep the original as your complete record. Removing pages from a working copy is a different task, available through Remove pages when you want to retain everything except a specified selection.",
      },
    ],
  },
  compress: {
    intro:
      "Compress PDF helps reduce document size before sharing or submitting a file. You can preserve text and vectors with lossless optimization, or choose image-based modes when a smaller file matters more than retaining document features. Compression results depend on the original: a scan with large images behaves differently from a compact text document. There is no guaranteed reduction percentage or automatic promise that a file will meet a portal's exact upload limit.",
    steps: [
      {
        title: "Add your PDF and check the destination",
        text: "Choose a PDF within the 50 MB input limit. Note the maximum size accepted by your email service, job application, or university portal before you begin. If the PDF is encrypted, provide the current password through the workspace's password setting.",
      },
      {
        title: "Try lossless compression first",
        text: "Select Lossless to optimize the document while preserving text and vectors. This is a sensible starting point for searchable documents, forms, and files with links. An already optimized PDF may show little improvement because there is less redundant data to remove.",
      },
      {
        title: "Consider balanced or smallest output",
        text: "Choose Balanced or Smallest if a stronger reduction is needed and page images suit your purpose. These modes flatten pages to images, removing searchable text, interactive forms, and links. Smallest uses lower image quality, so inspect fine print and detailed diagrams carefully.",
      },
      {
        title: "Compare size and readability",
        text: "Run the tool and download the result. Compare its actual size with the destination's requirement, then open several representative pages at a readable zoom. If compression would create a larger file, the tool keeps the original instead of offering a needlessly larger result.",
      },
    ],
    useCases: [
      {
        title: "Submit documents to a university portal",
        text: "Students often assemble transcripts, identification scans, and certificates into a document that exceeds a portal's stated limit. Compression can help, but grades, stamps, and signatures must remain readable. Check the university's requirements and review the output before submitting the final application.",
      },
      {
        title: "Send a scan over a limited connection",
        text: "A smaller PDF can make a scanned report easier to transfer on mobile data or an unreliable connection. For a document intended only for visual reading, image-based compression may be suitable. Keep a searchable original separately if you will need to search or extract its text later.",
      },
    ],
    faqs: [
      {
        title: "Why did my PDF barely shrink?",
        text: "The source may already use efficient compression, or most of its size may be essential image data. Lossless settings cannot discard visible information to force a reduction. Try an image-based mode only if its loss of text, links, and forms is acceptable.",
      },
      {
        title: "Can I restore quality after using Smallest?",
        text: "Not from the compressed output alone. Lower-quality page images discard detail, and enlarging them does not reconstruct the original. Keep the source file and rerun compression with a gentler setting whenever the result makes small text, seals, or drawings hard to read.",
      },
      {
        title: "Will the result fit a particular megabyte limit?",
        text: "The tool offers compression modes rather than a target-size guarantee. Download the result and check its size. If it remains too large, consider extracting only the pages the recipient needs, provided that the receiving organization allows a partial document.",
      },
    ],
  },
  "pdf-word": {
    intro:
      "PDF to Word creates a DOCX document from your PDF using either editable text or page images. Choose editable text when your goal is to rewrite selectable content, and preserve appearance when the page's visual arrangement matters most. PDFs describe finished pages rather than the original Word structure, so a conversion should be treated as a new starting point. It cannot reliably recreate every heading style, table, image placement, or original document setting.",
    steps: [
      {
        title: "Choose your PDF",
        text: "Add one PDF and provide its current password if necessary. Try selecting a sentence in a PDF viewer first: if the page is only a scanned image, editable conversion will not recognize the words because this tool does not include OCR.",
      },
      {
        title: "Pick the conversion mode",
        text: "Select Editable text to extract selectable text into a Word document. Select Preserve appearance to place page images inside the DOCX. The second option can represent scanned pages visually, but the words inside those page images do not become individually editable.",
      },
      {
        title: "Create and save the DOCX",
        text: "Press PDF to Word and wait for the download link. Save the generated DOCX with a distinct filename. Open it in an application that supports modern Word documents, keeping the original PDF nearby so you can compare important content during editing.",
      },
      {
        title: "Review before rewriting or sharing",
        text: "Check paragraph order, page breaks, symbols, and any text drawn from columns or tables. Add styles and rebuild layout where necessary. In appearance mode, verify the page images are readable; switch to editable mode only when the PDF contains a usable text layer.",
      },
    ],
    useCases: [
      {
        title: "Update a document whose source is missing",
        text: "An organization may have the final PDF of an internal checklist but no longer have its Word source. Editable conversion can supply text for a new draft. Compare the draft with the PDF before revising it so an extraction issue does not silently change an instruction.",
      },
      {
        title: "Include finished pages in a Word packet",
        text: "Appearance mode can place an existing handout or scanned reference into a DOCX for visual inclusion. This is useful when you want readers to see the original pages alongside newly written material. It is less suitable when they need to edit text inside those reference pages.",
      },
    ],
    faqs: [
      {
        title: "Can this convert scanned handwriting or printed scans?",
        text: "Appearance mode includes scans as page images. Editable mode requires selectable text and does not perform optical character recognition. Use an OCR workflow separately if you need recognized words from a scan, then proofread the recognized text before relying on it.",
      },
      {
        title: "Will tables and columns look exactly the same?",
        text: "Editable conversion extracts text rather than rebuilding the complete original design. Tables, columns, graphics, and special formatting can require manual reconstruction. Choose appearance mode for visual fidelity, understanding that the output then contains pictures of pages rather than editable page layouts.",
      },
      {
        title: "Does the tool produce a real Word file?",
        text: "Yes, the output is a DOCX container, not a PDF with a renamed extension. Its editability depends on the selected mode and the source's content. Older applications expecting the legacy DOC format may need a compatible editor to open or resave it.",
      },
    ],
  },
  "word-pdf": {
    intro:
      "Word to PDF converts a modern DOCX document into a shareable PDF using a reflow conversion. It is useful when the recipient needs to read document content without working directly in Word. The conversion handles readable text, tables, and supported images, but it is not Microsoft Word's own rendering engine. Plan to inspect the output when your document relies on exact pagination, custom fonts, complex positioning, or elaborate page design.",
    steps: [
      {
        title: "Prepare a modern Word document",
        text: "Save your source as DOCX and choose it in the input box. Legacy DOC files are not supported by this tool. Review the source first and remove draft material you do not want to distribute, keeping a separate editable copy for future changes.",
      },
      {
        title: "Check important document features",
        text: "Look for multi-column layouts, floating objects, charts, unusual fonts, and tables with complicated arrangements. These are reasons to compare the result closely with your source. If exact Word pagination is essential, use your document editor's native PDF export instead of relying on reflow.",
      },
      {
        title: "Run the conversion",
        text: "Press Word to PDF and keep the page open while the browser prepares the document. The combined input must remain within 50 MB. Once processing finishes, use the download link to save the new PDF rather than expecting the DOCX on disk to change.",
      },
      {
        title: "Open the PDF and verify it",
        text: "Read the first page, the final page, and any page containing a table or image. Check headings, paragraph order, symbols, and content near page breaks. Compare important passages with the DOCX before sending the PDF to another person or uploading it to a portal.",
      },
    ],
    useCases: [
      {
        title: "Share a straightforward assignment",
        text: "Students can turn a text-focused DOCX assignment into a PDF for a submission system that requests that format. Check the institution's required filename, size, and page count separately. Review mathematical symbols, citations, and tables because a readable conversion still needs an accuracy check.",
      },
      {
        title: "Distribute internal instructions",
        text: "A team can make a PDF copy of a simple process note, meeting summary, or reference checklist. Readers can view the result without editing the source. Keep the DOCX as the master document and regenerate the PDF after changes so the distributed version remains consistent with the current instructions.",
      },
    ],
    faqs: [
      {
        title: "Can I upload a DOC, ODT, or RTF file?",
        text: "The input accepts DOCX. Open other formats in a compatible word processor and save a modern DOCX copy before using this converter. Renaming an extension does not convert the underlying document and can cause the file to be rejected or read incorrectly.",
      },
      {
        title: "Why did line breaks or page counts change?",
        text: "Reflow creates new PDF pages from supported content rather than reproducing Word's exact layout engine. Font differences and complex formatting can change wrapping and pagination. Review the output or choose native export when a fixed template, exact line break, or precise page count is required.",
      },
      {
        title: "Does PDF conversion protect the document with a password?",
        text: "Conversion and encryption are separate operations. If you need an opening password, download the PDF and use Protect PDF afterward. Keep your editable source separately, and test that the protected result opens with the intended password before sharing it with its recipient.",
      },
    ],
  },
};
