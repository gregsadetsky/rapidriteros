sudo apt install git cmake libgbm-dev libdrm-dev libegl1-mesa-dev libgles2-mesa-dev libncurses5-dev libncursesw5-dev libxcb-randr0-dev
sudo apt install g++
sudo apt-get install xorg-dev libglu1-mesa-dev
sudo apt install xvfb

git clone https://github.com/patriciogonzalezvivo/glslViewer.git
cd glslViewer
git submodule init
git submodule update

mkdir build
cd build
cmake -DFORCE_DRM=TRUE ..
make
sudo make install
