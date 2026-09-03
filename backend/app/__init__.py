# RazorCartAI App Module

# ---------------------------------------------------------------------------
# Keep TensorFlow / Flax out of the process.
#
# sentence-transformers imports `transformers`, which probes for every
# available backend at import time.  `tf_keras` is installed transitively in
# this venv, so that probe drags the whole of TensorFlow in -- several seconds
# of import time and a wall of CUDA/oneDNN log spam, for a torch-only codebase.
#
# These must be set BEFORE anything imports `transformers`, which is why they
# live in the package __init__ rather than in the module that needs them.
# ---------------------------------------------------------------------------
import os as _os

_os.environ.setdefault("USE_TF", "0")
_os.environ.setdefault("USE_FLAX", "0")
_os.environ.setdefault("USE_TORCH", "1")
_os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
_os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
_os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

del _os
