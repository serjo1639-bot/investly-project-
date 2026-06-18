@echo off

echo ==========================================
echo Creating Virtual Environment
echo ==========================================

python -m venv .venv

call .venv\Scripts\activate

echo ==========================================
echo Updating pip
echo ==========================================

python -m pip install --upgrade pip

echo ==========================================
echo Installing PyTorch CUDA 12.4
echo ==========================================

pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

echo ==========================================
echo Installing Project Requirements
echo ==========================================

pip install -r requirements.txt

echo ==========================================
echo Testing GPU
echo ==========================================

python -c "import torch;print('Torch:',torch.__version__);print('CUDA:',torch.cuda.is_available());print('GPU:',torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NO GPU')"

pause