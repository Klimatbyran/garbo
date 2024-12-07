import logging
import json
import sys
import os
from argparse import ArgumentParser
from io import BytesIO
from pathlib import Path

from docling.datamodel.base_models import ConversionStatus
from docling.datamodel.document import ConversionResult
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode
from docling.document_converter import DocumentConverter, PdfFormatOption, DocumentStream, _DocumentConversionInput
from docling.models.tesseract_ocr_model import TesseractOcrOptions

_log = logging.getLogger('parse_pdf')

def export_document(
    conv_result: ConversionResult,
    output_dir: Path,
):
    output_dir.mkdir(parents=True, exist_ok=True)

    if conv_result.status == ConversionStatus.SUCCESS:
        json_file = output_dir / "parsed.json"
        markdown_file = output_dir / "parsed.md"

        with json_file.open("w", encoding="utf-8") as fp:
            json.dump(conv_result.document.export_to_dict(), fp, ensure_ascii=False)
            _log.info(f"Saved document JSON to: {json_file}")

        with markdown_file.open("w", encoding="utf-8") as fp:
            fp.write(conv_result.document.export_to_markdown(image_placeholder=''))
            _log.info(f"Saved document Markdown to: {markdown_file}")

    elif conv_result.status == ConversionStatus.PARTIAL_SUCCESS:
        _log.info(
            f"Document {conv_result.input.file} was partially converted with the following errors:"
        )
        for item in conv_result.errors:
            _log.info(f"\t{item.error_message}")
    else:
        _log.info(f"Document {conv_result.input.file} failed to convert.")

def parse_document(input_file: Path, output_dir: Path):
    if not os.path.exists(input_file):
        raise Exception(f"Input PDF does not exist: {input_file}")

    _log.info(f"Parsing {input_file} with Docling and Tesseract...")

    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True
    # TODO: decide between ACCURATE and FAST modes
    # with accurate parsing: 108 tables on 42 unique pages - 300 seconds => 5 min
    # with fast parsing:	 108 tables on 42 unique pages - 175 seconds => 3 min
    pipeline_options.table_structure_options.mode = TableFormerMode.FAST
    pipeline_options.ocr_options = TesseractOcrOptions()
    pipeline_options.ocr_options.lang = ["swe", "eng"]

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    buf = BytesIO(input_file.open("rb").read())
    input_stream = DocumentStream(name=input_file.name, stream=buf)

    conv_result = doc_converter.convert(input_stream, raises_on_error=False)
    export_document(conv_result, output_dir)



def main():
    logging.basicConfig(level=logging.INFO)

    arg_parser = ArgumentParser(prog="parse_pdf", description='Parse a PDF')
    arg_parser.add_argument('inputPDF', help="Path to the input PDF document")
    arg_parser.add_argument('outDir', help="Path to the output directory for results to the current document")
    parsed_args = arg_parser.parse_args(sys.argv[1:])

    parse_document(Path(parsed_args.inputPDF), Path(parsed_args.outDir))

if __name__ == "__main__":
    main()