import logging
import time
import json
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

    _log.info(
        f"Processed {success_count + partial_success_count + failure_count} docs, "
        f"of which {failure_count} failed "
        f"and {partial_success_count} were partially converted."
    )
    return success_count, partial_success_count, failure_count


def main():
    logging.basicConfig(level=logging.INFO)

    input_file=Path("../garbo_pdfs/Vestum-arsredovisning-2023.pdf")
    buf = BytesIO(input_file.open("rb").read())
    input_streams = [DocumentStream(name=input_file.name, stream=buf)]

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

    start_time = time.time()

    conv_result = doc_converter.convert(input_streams, raises_on_error=False)
    export_documents([conv_result], output_dir=Path("scratch"))

    end_time = time.time() - start_time

    _log.info(f"Document conversion complete in {end_time:.2f} seconds.")

if __name__ == "__main__":
    main()