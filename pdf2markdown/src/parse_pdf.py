import logging
import json
import sys
import os
from argparse import ArgumentParser
from io import BytesIO
from pathlib import Path
from typing import Iterable

from docling.datamodel.base_models import ConversionStatus
from docling.datamodel.document import ConversionResult
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode
from docling.document_converter import DocumentConverter, PdfFormatOption, DocumentStream, _DocumentConversionInput
from docling.models.tesseract_ocr_model import TesseractOcrOptions

_log = logging.getLogger(__name__)

def export_documents(
    conv_results: Iterable[ConversionResult],
    output_dir: Path,
):
    output_dir.mkdir(parents=True, exist_ok=True)

    success_count = 0
    failure_count = 0
    partial_success_count = 0

    for conv_res in conv_results:
        if conv_res.status == ConversionStatus.SUCCESS:
            success_count += 1
            doc_filename = conv_res.input.file.stem

            with (output_dir / f"{doc_filename}.json").open("w") as fp:
                json.dump(conv_res.document.export_to_dict(), fp, ensure_ascii=False)

        elif conv_res.status == ConversionStatus.PARTIAL_SUCCESS:
            _log.info(
                f"Document {conv_res.input.file} was partially converted with the following errors:"
            )
            for item in conv_res.errors:
                _log.info(f"\t{item.error_message}")
            partial_success_count += 1
        else:
            _log.info(f"Document {conv_res.input.file} failed to convert.")
            failure_count += 1

    return success_count, partial_success_count, failure_count


def main():
    logging.basicConfig(level=logging.INFO)

    arg_parser = ArgumentParser(prog="parse_pdf", description='Parse a PDF')
    arg_parser.add_argument('docId', help="The document ID to parse")

    parsed_args = arg_parser.parse_args(sys.argv[1:])

    base_dir = Path('/tmp/pdf2markdown/') / parsed_args.docId
    input_file = base_dir / 'input.pdf'

    if not os.path.exists(input_file):
        raise Exception(f"Input PDF does not exist: {input_file}")
    
    _log.info(f"Parsing {input_file}")

    # TODO: read input file from directory
    # TODO: use the docId directory as base output_dir

    buf = BytesIO(input_file.open("rb").read())
    input_stream = DocumentStream(name=input_file.name, stream=buf)

    # Docling Parse with Tesseract
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

    conv_result = doc_converter.convert(input_stream, raises_on_error=False)
    export_documents([conv_result], output_dir=Path("scratch"))

if __name__ == "__main__":
    main()