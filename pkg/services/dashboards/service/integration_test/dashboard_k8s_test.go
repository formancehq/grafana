package integration_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	dashboardv1alpha1 "github.com/grafana/grafana/apps/dashboard/pkg/apis/dashboard/v1alpha1"
	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/tests/apis"
	"github.com/grafana/grafana/pkg/tests/testinfra"
	"github.com/grafana/grafana/pkg/tests/testsuite"
)

func TestMain(m *testing.M) {
	testsuite.Run(m)
}

func TestIntegrationK8sDashboardCreateAndDelete(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	// Create a K8sTestHelper which will set up a real API server
	helper := apis.NewK8sTestHelper(t, testinfra.GrafanaOpts{
		DisableAnonymous: true,
		EnableFeatureToggles: []string{
			featuremgmt.FlagKubernetesClientDashboardsFolders, // Enable dashboard feature
		},
	})

	t.Cleanup(func() {
		helper.Shutdown()
	})

	// Log the server address for debugging
	t.Logf("API Server address: %s", helper.GetEnv().Server.HTTPServer.Listener.Addr())

	// Define the resource we're testing
	gvr := schema.GroupVersionResource{
		Group:    "dashboard.grafana.app",
		Version:  "v1alpha1",
		Resource: "dashboards",
	}

	// Create a context with admin user for testing
	adminUser := helper.Org1.Admin
	ctx := identity.WithRequester(context.Background(), adminUser.Identity)

	// Get a client for the dashboard resource
	client := helper.GetResourceClient(apis.ResourceClientArgs{
		User: adminUser,
		GVR:  gvr,
	})

	// Verify no dashboards initially
	rsp, err := client.Resource.List(ctx, v1.ListOptions{})
	require.NoError(t, err)
	require.Empty(t, rsp.Items)

	// Create a dashboard resource
	dashboardTitle := "Test dashboard (created from k8s)"
	dashObj := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": dashboardv1alpha1.DashboardResourceInfo.GroupVersion().String(),
			"kind":       dashboardv1alpha1.DashboardResourceInfo.GroupVersionKind().Kind,
			"metadata": map[string]interface{}{
				"name": "test-",
			},
			"spec": map[string]interface{}{
				"title": dashboardTitle,
			},
		},
	}

	// Create the dashboard using the K8s client
	createdDash, err := client.Resource.Create(ctx, dashObj, v1.CreateOptions{})
	require.NoError(t, err, "Should be able to create dashboard")

	// Get the generated name
	dashboardName := createdDash.GetName()
	require.NotEmpty(t, dashboardName, "Dashboard name should not be empty")
	t.Logf("Created dashboard with name: %s", dashboardName)

	// Verify the dashboard was created by retrieving it
	retrievedDash, err := client.Resource.Get(ctx, dashboardName, v1.GetOptions{})
	require.NoError(t, err, "Should be able to get dashboard")

	// Verify the dashboard has the right properties
	spec, ok := retrievedDash.Object["spec"].(map[string]interface{})
	require.True(t, ok, "Should have a spec")

	retrievedTitle, ok := spec["title"].(string)
	require.True(t, ok, "Should have a title")
	require.Equal(t, dashboardTitle, retrievedTitle, "Dashboard title should match")

	// List dashboards and ensure it's listed
	dashboards, err := client.Resource.List(ctx, v1.ListOptions{})
	require.NoError(t, err)
	require.Len(t, dashboards.Items, 1, "Should have one dashboard")
	require.Equal(t, dashboardName, dashboards.Items[0].GetName(), "Dashboard name should match")

	// Delete the dashboard
	err = client.Resource.Delete(ctx, dashboardName, v1.DeleteOptions{})
	require.NoError(t, err, "Should be able to delete dashboard")

	// Verify the dashboard was deleted
	_, err = client.Resource.Get(ctx, dashboardName, v1.GetOptions{})
	require.Error(t, err, "Dashboard should be deleted")

	// Verify the dashboard is gone from the list
	dashboards, err = client.Resource.List(ctx, v1.ListOptions{})
	require.NoError(t, err)
	require.Empty(t, dashboards.Items, "Dashboard list should be empty")
}
