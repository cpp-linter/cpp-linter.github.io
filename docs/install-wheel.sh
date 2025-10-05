#!/bin/bash
# Download clang-format or clang-tidy wheel for the current platform
# Usage: curl -LsSf https://cpp-linter.github.io/install-wheel.sh | bash -s -- clang-format

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}INFO${NC}: $1"
}

warn() {
    echo -e "${YELLOW}WARN${NC}: $1"
}

error() {
    echo -e "${RED}ERROR${NC}: $1"
    exit 1
}

success() {
    echo -e "${GREEN}SUCCESS${NC}: $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] <tool>

Download clang-format or clang-tidy wheel for current platform

ARGUMENTS:
    <tool>              Tool to download (clang-format or clang-tidy)

OPTIONS:
    -v, --version       Specific version to download (default: latest)
    -o, --output        Output directory (default: current directory)
    -p, --platform      Override platform detection (advanced usage)
    -l, --list          List all available platforms for the latest release
    -h, --help          Show this help message

EXAMPLES:
    # Download latest clang-format
    $0 clang-format

    # Download specific version
    $0 clang-format --version 20.1.8

    # Download to specific directory
    $0 clang-format --output ./wheels

    # Via curl
    curl -LsSf https://cpp-linter.github.io/install-wheel.sh | bash -s -- clang-format
EOF
}

# Detect platform and return appropriate wheel tag
get_platform_tag() {
    local system=$(uname -s | tr '[:upper:]' '[:lower:]')
    local machine=$(uname -m | tr '[:upper:]' '[:lower:]')

    # Normalize machine architecture names
    case "$machine" in
        x86_64|amd64) machine="x86_64" ;;
        aarch64) machine="aarch64" ;;
        arm64) machine="arm64" ;;
        armv7l) machine="armv7l" ;;
        i386|i686) machine="i686" ;;
        ppc64le) machine="ppc64le" ;;
        s390x) machine="s390x" ;;
    esac

    case "$system" in
        darwin) # macOS
            if [[ "$machine" == "arm64" || "$machine" == "aarch64" ]]; then
                echo "macosx_11_0_arm64"
            else
                echo "macosx_10_9_x86_64"
            fi
            ;;
        linux)
            # Try to detect libc type
            local libc="manylinux"
            if command_exists ldd; then
                if ldd --version 2>&1 | grep -qi "musl"; then
                    libc="musllinux"
                fi
            fi

            if [[ "$libc" == "manylinux" ]]; then
                case "$machine" in
                    x86_64)
                        echo "manylinux_2_27_x86_64.manylinux_2_28_x86_64"
                        ;;
                    aarch64)
                        echo "manylinux_2_26_aarch64.manylinux_2_28_aarch64"
                        ;;
                    i686)
                        echo "manylinux_2_26_i686.manylinux_2_28_i686"
                        ;;
                    ppc64le)
                        echo "manylinux_2_26_ppc64le.manylinux_2_28_ppc64le"
                        ;;
                    s390x)
                        echo "manylinux_2_26_s390x.manylinux_2_28_s390x"
                        ;;
                    armv7l)
                        echo "manylinux_2_31_armv7l"
                        ;;
                esac
            else # musllinux
                echo "musllinux_1_2_${machine}"
            fi
            ;;
        mingw*|msys*|cygwin*)  # Windows
            case "$machine" in
                x86_64|amd64) echo "win_amd64" ;;
                arm64) echo "win_arm64" ;;
                *) echo "win32" ;;
            esac
            ;;
        *)
            error "Unsupported platform: $system $machine"
            ;;
    esac
}

# Get release information from GitHub API
get_release_info() {
    local repo="cpp-linter/clang-tools-wheel"
    local version="$1"
    local url

    if [[ -n "$version" ]]; then
        # Remove 'v' prefix if present
        version=${version#v}
        url="https://api.github.com/repos/${repo}/releases/tags/v${version}"
    else
        url="https://api.github.com/repos/${repo}/releases/latest"
    fi

    if command_exists curl; then
        curl -sSL "$url"
    elif command_exists wget; then
        wget -qO- "$url"
    else
        error "Neither curl nor wget found. Please install one of them."
    fi
}

# Find wheel asset for given tool and platform
find_wheel_asset() {
    local json_data="$1"
    local tool="$2"
    local platform_tag="$3"
    local version="$4"

    # Try both naming conventions: clang-format and clang_format
    local tool_underscore="${tool//-/_}"

    # Extract assets and find matching wheel
    if command_exists jq; then
        # Use jq if available (more reliable)
        echo "$json_data" | jq -r --arg tool "$tool" --arg tool_us "$tool_underscore" --arg platform "$platform_tag" --arg version "$version" '
            .assets[] |
            select(.name | test("\\.(whl)$")) |
            select(.name | test("^(" + $tool + "|" + $tool_us + ")-")) |
            select(.name | contains($platform)) |
            if $version != "" then select(.name | contains($version)) else . end |
            .browser_download_url + "|" + .name + "|" + (.size | tostring)
        ' | head -n1
    else
        # Fallback: use grep and sed (less reliable but works without jq)
        echo "$json_data" | grep -o '"browser_download_url":"[^"]*"' | sed 's/"browser_download_url":"//; s/"//' | while read -r url; do
            local filename=$(echo "$url" | sed 's|.*/||')
            if [[ "$filename" == *".whl" ]] && [[ "$filename" == "$tool"* || "$filename" == "$tool_underscore"* ]] && [[ "$filename" == *"$platform_tag"* ]]; then
                if [[ -z "$version" ]] || [[ "$filename" == *"$version"* ]]; then
                    echo "$url|$filename|unknown"
                    break
                fi
            fi
        done
    fi
}

# Download file
download_file() {
    local url="$1"
    local filename="$2"

    info "Downloading $filename..."

    if command_exists curl; then
        if curl -fsSL -o "$filename" "$url"; then
            success "Successfully downloaded $filename"
            return 0
        else
            error "Failed to download $filename"
        fi
    elif command_exists wget; then
        if wget -q -O "$filename" "$url"; then
            success "Successfully downloaded $filename"
            return 0
        else
            error "Failed to download $filename"
        fi
    else
        error "Neither curl nor wget found. Please install one of them."
    fi
}

# List available platforms
list_platforms() {
    local json_data="$1"
    local tool="$2"

    info "Available platforms for $tool:"

    if command_exists jq; then
        echo "$json_data" | jq -r --arg tool "$tool" --arg tool_us "${tool//-/_}" '
            .assets[] |
            select(.name | test("\\.(whl)$")) |
            select(.name | test("^(" + $tool + "|" + $tool_us + ")-")) |
            .name
        ' | sed 's/.*py2\.py3-none-//; s/\.whl$//' | sort -u | while read -r platform; do
            echo "  $platform"
        done
    else
        # Fallback without jq
        echo "$json_data" | grep -o '"name":"[^"]*\.whl"' | sed 's/"name":"//; s/"//' | grep -E "^($tool|${tool//-/_})-" | sed 's/.*py2\.py3-none-//; s/\.whl$//' | sort -u | while read -r platform; do
            echo "  $platform"
        done
    fi
}

# Main function
main() {
    local tool=""
    local version=""
    local output_dir="."
    local platform_override=""
    local list_platforms_flag=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--version)
                version="$2"
                shift 2
                ;;
            -o|--output)
                output_dir="$2"
                shift 2
                ;;
            -p|--platform)
                platform_override="$2"
                shift 2
                ;;
            -l|--list)
                list_platforms_flag=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            clang-format|clang-tidy)
                tool="$1"
                shift
                ;;
            -*)
                error "Unknown option: $1"
                ;;
            *)
                if [[ -z "$tool" ]]; then
                    tool="$1"
                else
                    error "Unknown argument: $1"
                fi
                shift
                ;;
        esac
    done

    # Validate tool argument
    if [[ -z "$tool" ]]; then
        error "Tool argument is required. Use 'clang-format' or 'clang-tidy'"
        echo
        show_usage
        exit 1
    fi

    if [[ "$tool" != "clang-format" && "$tool" != "clang-tidy" ]]; then
        error "Invalid tool: $tool. Use 'clang-format' or 'clang-tidy'"
        exit 1
    fi

    # Get release information
    if [[ -n "$version" ]]; then
        info "Fetching release information for version $version..."
    else
        info "Fetching latest release information..."
    fi

    local release_info
    release_info=$(get_release_info "$version")
    if [[ $? -ne 0 ]] || [[ -z "$release_info" ]]; then
        error "Failed to fetch release information"
    fi

    # Extract release tag
    local release_tag
    if command_exists jq; then
        release_tag=$(echo "$release_info" | jq -r '.tag_name')
    else
        release_tag=$(echo "$release_info" | grep -o '"tag_name":"[^"]*"' | sed 's/"tag_name":"//; s/"//')
    fi

    if [[ "$list_platforms_flag" == true ]]; then
        info "Release: $release_tag"
        list_platforms "$release_info" "$tool"
        exit 0
    fi

    # Detect platform
    local platform_tag
    if [[ -n "$platform_override" ]]; then
        platform_tag="$platform_override"
        info "Using platform override: $platform_tag"
    else
        platform_tag=$(get_platform_tag)
        info "Detected platform: $platform_tag"
    fi

    # Find wheel asset
    local release_version="${release_tag#v}"
    local wheel_info
    wheel_info=$(find_wheel_asset "$release_info" "$tool" "$platform_tag" "$release_version")

    if [[ -z "$wheel_info" ]]; then
        error "No wheel found for $tool on platform $platform_tag"
        echo "Available release: $release_tag"
        echo "Use --list to see all available platforms"
        exit 1
    fi

    # Parse wheel info
    IFS='|' read -r download_url filename file_size <<< "$wheel_info"

    # Create output directory
    mkdir -p "$output_dir"

    # Download the wheel
    local output_file="$output_dir/$filename"
    if download_file "$download_url" "$output_file"; then
        echo
        success "Wheel downloaded successfully!"
        echo "File: $output_file"
        if [[ "$file_size" != "unknown" ]]; then
            local size_mb=$((file_size / 1024 / 1024))
            echo "Size: ${size_mb} MB"
        fi
        echo
        info "To install: pip install $output_file"
    else
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
